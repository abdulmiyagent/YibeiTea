import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";
import { generateOrderNumber, calculateLoyaltyTier } from "@/lib/utils";
import { TRPCError } from "@trpc/server";

export const ordersRouter = router({
  create: publicProcedure
    .input(z.object({
      items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        customizations: z.any().optional(),
      })),
      customerName: z.string(),
      customerEmail: z.string().email(),
      customerPhone: z.string().optional(),
      pickupTime: z.string(),
      notes: z.string().optional(),
      promoCode: z.string().optional(),
      rewardId: z.string().optional(), // Selected reward to redeem at checkout
    }))
    .mutation(async ({ ctx, input }) => {
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );

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
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          pickupTime: new Date(input.pickupTime),
          notes: input.notes,
          subtotal,
          discount,
          total,
          pointsEarned,
          pointsRedeemed,
          updatedAt: new Date(),
          items: {
            create: input.items.map((item) => ({
              id: crypto.randomUUID(),
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              customizations: item.customizations,
            })),
          },
        },
        include: { items: true },
      });

      // Process REDEEMED points immediately (to prevent double-use)
      // EARNED points are handled by the Mollie webhook after successful payment
      if (ctx.session?.user?.id && pointsRedeemed > 0) {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { loyaltyPoints: true },
        });

        if (user) {
          const newPoints = Math.max(0, user.loyaltyPoints - pointsRedeemed);
          const newTier = calculateLoyaltyTier(newPoints);

          // Deduct redeemed points
          await ctx.db.user.update({
            where: { id: ctx.session.user.id },
            data: {
              loyaltyPoints: newPoints,
              loyaltyTier: newTier,
            },
          });

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
      include: { items: { include: { product: true } } },
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
});
