import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";
import { generateOrderNumber, calculateLoyaltyTier } from "@/lib/utils";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { TRPCError } from "@trpc/server";

/**
 * Check rate limit for guest orders using shared rate limiter (Upstash Redis or in-memory fallback)
 */
async function checkGuestOrderRateLimit(email: string): Promise<void> {
  const identifier = `guest-order:${email.toLowerCase()}`;
  const result = await checkRateLimit(identifier, rateLimiters.guestOrder);

  if (!result.success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Te veel bestellingen. Probeer het later opnieuw of maak een account aan.",
    });
  }
}

// Proper schema for customizations instead of z.any()
const customizationsSchema = z.object({
  sugarLevel: z.number().min(0).max(100).optional(),
  iceLevel: z.string().optional(),
  toppings: z.array(z.string()).optional(),
  milkType: z.string().optional(),
  size: z.string().optional(),
}).optional();

export const ordersRouter = router({
  create: publicProcedure
    .input(z.object({
      items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().positive().int().max(99),
        customizations: customizationsSchema,
      })),
      customerName: z.string().min(1).max(100),
      customerEmail: z.string().email().max(255),
      customerPhone: z.string().max(20).optional(),
      pickupTime: z.string(),
      notes: z.string().max(500).optional(),
      promoCode: z.string().max(20).optional(),
      rewardId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if this is a guest order
      const isGuest = !ctx.session?.user?.id;

      // Apply rate limiting for guest orders
      if (isGuest) {
        await checkGuestOrderRateLimit(input.customerEmail);
      }

      // Fetch product prices from database (security: never trust client prices)
      const productIds = input.items.map(item => item.productId);
      const products = await ctx.db.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true, isAvailable: true },
      });

      const productMap = new Map(products.map(p => [p.id, p]));

      // Validate all products exist and are available
      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Product niet gevonden: ${item.productId}`,
          });
        }
        if (!product.isAvailable) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Een of meer producten zijn niet beschikbaar",
          });
        }
      }

      // Calculate subtotal from database prices
      const subtotal = input.items.reduce((sum, item) => {
        const product = productMap.get(item.productId)!;
        return sum + Number(product.price) * item.quantity;
      }, 0);

      let discount = 0;
      let pointsRedeemed = 0;
      let rewardName = "";
      let promoCodeUsed: string | null = null;

      // Process promo code if provided
      if (input.promoCode) {
        const promoCode = await ctx.db.promoCode.findUnique({
          where: { code: input.promoCode.toUpperCase() },
        });

        if (promoCode && promoCode.isActive) {
          const now = new Date();
          const isValid =
            now >= promoCode.validFrom &&
            now <= promoCode.validUntil &&
            (!promoCode.maxUses || promoCode.usedCount < promoCode.maxUses) &&
            (!promoCode.minOrderAmount || subtotal >= Number(promoCode.minOrderAmount));

          if (isValid) {
            if (promoCode.discountType === "PERCENTAGE") {
              discount = (subtotal * Number(promoCode.discountValue)) / 100;
            } else {
              discount = Number(promoCode.discountValue);
            }
            discount = Math.min(discount, subtotal);
            promoCodeUsed = promoCode.code;

            // Increment usage count
            await ctx.db.promoCode.update({
              where: { id: promoCode.id },
              data: { usedCount: { increment: 1 } },
            });
          }
        }
      }

      // Process reward redemption if selected and user is logged in (can stack with promo code)
      if (input.rewardId && ctx.session?.user?.id) {
        const reward = await ctx.db.reward.findUnique({
          where: { id: input.rewardId },
          include: { translations: true },
        });

        if (!reward || !reward.isAvailable) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Deze beloning is niet beschikbaar",
          });
        }

        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { loyaltyPoints: true },
        });

        if (!user || user.loyaltyPoints < reward.pointsCost) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Je hebt niet genoeg punten voor deze beloning",
          });
        }

        // Calculate discount based on reward type
        pointsRedeemed = reward.pointsCost;
        rewardName = reward.translations[0]?.name || reward.slug;

        let rewardDiscount = 0;
        switch (reward.rewardType) {
          case "DISCOUNT":
            rewardDiscount = Number(reward.rewardValue);
            break;
          case "FREE_DRINK":
            // Free drink up to reward value
            rewardDiscount = Math.min(Number(reward.rewardValue), subtotal);
            break;
          case "FREE_TOPPING":
            // Small discount for free topping
            rewardDiscount = Number(reward.rewardValue);
            break;
          case "SIZE_UPGRADE":
            // Small discount for size upgrade
            rewardDiscount = Number(reward.rewardValue);
            break;
          default:
            rewardDiscount = Number(reward.rewardValue);
        }

        // Add reward discount to total discount (stacks with promo code)
        discount += rewardDiscount;
      }

      // Ensure total discount doesn't exceed subtotal
      discount = Math.min(discount, subtotal);

      const total = Math.max(0, subtotal - discount);
      const pointsEarned = Math.floor(total * 10); // Earn points on final total, not subtotal

      const order = await ctx.db.order.create({
        data: {
          id: crypto.randomUUID(),
          orderNumber: generateOrderNumber(),
          userId: ctx.session?.user?.id,
          isGuest,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          pickupTime: new Date(input.pickupTime),
          notes: input.notes,
          subtotal,
          discount,
          total,
          pointsEarned: isGuest ? 0 : pointsEarned, // Guests don't earn points
          pointsRedeemed,
          updatedAt: new Date(),
          items: {
            create: input.items.map((item) => {
              const product = productMap.get(item.productId)!;
              const unitPrice = Number(product.price);
              return {
                id: crypto.randomUUID(),
                productId: item.productId,
                quantity: item.quantity,
                unitPrice,
                totalPrice: unitPrice * item.quantity,
                customizations: item.customizations,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Process REDEEMED points immediately using atomic operation (to prevent race conditions)
      // EARNED points are handled by the Mollie webhook after successful payment
      if (ctx.session?.user?.id && pointsRedeemed > 0) {
        // Use atomic decrement with WHERE clause to prevent double-spending
        // This ensures the user still has enough points at the moment of deduction
        const updateResult = await ctx.db.user.updateMany({
          where: {
            id: ctx.session.user.id,
            loyaltyPoints: { gte: pointsRedeemed }, // Only update if they still have enough points
          },
          data: {
            loyaltyPoints: { decrement: pointsRedeemed },
          },
        });

        // If no rows were updated, the user no longer has enough points (race condition)
        if (updateResult.count === 0) {
          // Rollback: delete the order that was just created
          await ctx.db.order.delete({ where: { id: order.id } });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Je hebt niet meer genoeg punten voor deze beloning",
          });
        }

        // Fetch updated points to recalculate tier
        const updatedUser = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { loyaltyPoints: true },
        });

        if (updatedUser) {
          const newTier = calculateLoyaltyTier(updatedUser.loyaltyPoints);
          await ctx.db.user.update({
            where: { id: ctx.session.user.id },
            data: { loyaltyTier: newTier },
          });
        }

        // Create REDEEM transaction
        await ctx.db.loyaltyTransaction.create({
          data: {
            id: crypto.randomUUID(),
            userId: ctx.session.user.id,
            points: -pointsRedeemed,
            type: "REDEEM",
            description: `Ingewisseld: ${rewardName} (Bestelling ${order.orderNumber})`,
            orderId: order.id,
          },
        });
      }
      // Note: EARN transactions are created by the Mollie webhook after payment confirmation

      return order;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.order.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { items: { include: { product: true } } },
      });
    }),

  // Public query for order confirmation page (by order number)
  getByOrderNumber: publicProcedure
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { orderNumber: input.orderNumber },
        include: {
          items: {
            include: {
              product: {
                include: {
                  translations: true,
                },
              },
            },
          },
        },
      });

      if (!order) return null;

      return {
        orderNumber: order.orderNumber,
        status: order.status,
        pickupTime: order.pickupTime,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        total: Number(order.total),
        pointsEarned: order.pointsEarned,
        items: order.items.map((item) => ({
          name: item.product.translations[0]?.name || item.product.slug,
          quantity: item.quantity,
          price: Number(item.unitPrice),
          customizations: item.customizations as Record<string, unknown> | null,
        })),
      };
    }),

  getMyOrders: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.order.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: { translations: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Admin routes
  getAll: adminProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.order.findMany({
        where: input?.status ? { status: input.status as any } : undefined,
        include: {
          items: {
            include: {
              product: {
                include: { translations: true },
              },
            },
          },
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit || 50,
      });
    }),

  updateStatus: adminProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["PENDING", "PAID", "PREPARING", "READY", "COMPLETED", "CANCELLED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      // Send notification email when order is ready
      if (input.status === "READY" && order.customerEmail) {
        const { sendOrderReadyNotification } = await import("@/lib/email");
        await sendOrderReadyNotification({
          orderNumber: order.orderNumber,
          customerName: order.customerName || "Klant",
          customerEmail: order.customerEmail,
        });
      }

      return order;
    }),

  getTodayStats: adminProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const ordersToday = await ctx.db.order.findMany({
      where: { createdAt: { gte: today } },
    });

    const ordersYesterday = await ctx.db.order.findMany({
      where: {
        createdAt: { gte: yesterday, lt: today },
      },
    });

    const todayRevenue = ordersToday.reduce((sum, o) => sum + Number(o.total), 0);
    const yesterdayRevenue = ordersYesterday.reduce((sum, o) => sum + Number(o.total), 0);

    return {
      count: ordersToday.length,
      revenue: todayRevenue,
      pending: ordersToday.filter((o) => ["PENDING", "PAID", "PREPARING"].includes(o.status)).length,
      yesterdayCount: ordersYesterday.length,
      yesterdayRevenue,
    };
  }),

  getRecentOrders: adminProcedure
    .input(z.object({ limit: z.number().default(5) }).optional())
    .query(async ({ ctx, input }) => {
      const orders = await ctx.db.order.findMany({
        include: {
          items: {
            include: {
              product: {
                include: { translations: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit || 5,
      });

      return orders.map((order) => ({
        id: order.orderNumber,
        customer: order.customerName || "Gast",
        items: order.items.map((item) => item.product.translations[0]?.name || item.product.slug),
        total: Number(order.total),
        status: order.status,
        time: order.pickupTime
          ? new Date(order.pickupTime).toLocaleTimeString("nl-BE", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
      }));
    }),

  getPopularProducts: adminProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orderItems = await ctx.db.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: thirtyDaysAgo },
          status: { not: "CANCELLED" },
        },
      },
      include: {
        product: {
          include: { translations: true },
        },
      },
    });

    const productCounts = orderItems.reduce((acc, item) => {
      const productId = item.productId;
      if (!acc[productId]) {
        acc[productId] = {
          name: item.product.translations[0]?.name || item.product.slug,
          orders: 0,
        };
      }
      acc[productId].orders += item.quantity;
      return acc;
    }, {} as Record<string, { name: string; orders: number }>);

    return Object.values(productCounts)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 4);
  }),

  // Get active orders (PAID + PREPARING) for dashboard widget
  getActiveOrders: adminProcedure.query(async ({ ctx }) => {
    const orders = await ctx.db.order.findMany({
      where: {
        status: { in: ["PAID", "PREPARING"] },
      },
      include: {
        items: {
          include: {
            product: {
              include: { translations: true },
            },
          },
        },
      },
      orderBy: [
        { pickupTime: "asc" },
        { createdAt: "asc" },
      ],
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      total: Number(order.total),
      pickupTime: order.pickupTime,
      createdAt: order.createdAt,
      notes: order.notes,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        productName: item.product.translations[0]?.name || item.product.slug,
        customizations: item.customizations as Record<string, unknown> | null,
      })),
    }));
  }),

  // Cancel order with reason tracking
  cancelOrder: adminProcedure
    .input(z.object({
      id: z.string(),
      reason: z.enum(["BUSY", "OUT_OF_STOCK", "CUSTOMER_REQUEST", "OTHER"]),
      customReason: z.string().max(200).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        select: {
          status: true,
          createdAt: true,
          customerEmail: true,
          customerName: true,
          orderNumber: true,
          total: true,
          pointsRedeemed: true,
          userId: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bestelling niet gevonden",
        });
      }

      // Check if order can be cancelled (within 30 minutes of creation or still PAID/PREPARING)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const canCancel = order.status === "PAID" || order.status === "PREPARING";

      if (!canCancel) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deze bestelling kan niet meer geannuleerd worden",
        });
      }

      // Update order with cancellation info
      const updatedOrder = await ctx.db.order.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          cancellationReason: input.reason,
          cancelledAt: new Date(),
          notes: input.customReason
            ? `${order.orderNumber} - Reden: ${input.customReason}`
            : undefined,
        },
      });

      // Restore redeemed points if any
      if (order.pointsRedeemed > 0 && order.userId) {
        await ctx.db.user.update({
          where: { id: order.userId },
          data: {
            loyaltyPoints: { increment: order.pointsRedeemed },
          },
        });

        // Create refund transaction
        await ctx.db.loyaltyTransaction.create({
          data: {
            id: crypto.randomUUID(),
            userId: order.userId,
            points: order.pointsRedeemed,
            type: "ADJUSTMENT",
            description: `Punten teruggestort: Bestelling ${order.orderNumber} geannuleerd`,
            orderId: input.id,
          },
        });
      }

      // Send cancellation email
      if (order.customerEmail) {
        const { sendOrderCancellationEmail } = await import("@/lib/email");
        await sendOrderCancellationEmail({
          orderNumber: order.orderNumber,
          customerName: order.customerName || "Klant",
          customerEmail: order.customerEmail,
          total: Number(order.total),
          reason: input.reason,
        });
      }

      return updatedOrder;
    }),

  // Bulk update status for multiple orders
  bulkUpdateStatus: adminProcedure
    .input(z.object({
      orderIds: z.array(z.string()),
      status: z.enum(["PREPARING", "READY", "COMPLETED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const results = await Promise.allSettled(
        input.orderIds.map(async (orderId) => {
          const order = await ctx.db.order.update({
            where: { id: orderId },
            data: { status: input.status },
          });

          // Send notification email when order is ready
          if (input.status === "READY" && order.customerEmail) {
            const { sendOrderReadyNotification } = await import("@/lib/email");
            await sendOrderReadyNotification({
              orderNumber: order.orderNumber,
              customerName: order.customerName || "Klant",
              customerEmail: order.customerEmail,
            });
          }

          return order;
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: input.orderIds.length };
    }),

  // Get order count for polling (lightweight endpoint)
  getActiveOrderCount: adminProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.order.count({
      where: {
        status: { in: ["PAID", "PREPARING"] },
      },
    });

    const latestOrder = await ctx.db.order.findFirst({
      where: {
        status: { in: ["PAID", "PREPARING"] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    });

    return {
      count,
      latestOrderId: latestOrder?.id || null,
      latestOrderTime: latestOrder?.createdAt || null,
    };
  }),
});
