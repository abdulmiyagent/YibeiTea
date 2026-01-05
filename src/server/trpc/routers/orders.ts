import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";
import { generateOrderNumber } from "@/lib/utils";

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
    }))
    .mutation(async ({ ctx, input }) => {
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );

      const order = await ctx.db.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: ctx.session?.user?.id,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          pickupTime: new Date(input.pickupTime),
          notes: input.notes,
          subtotal,
          total: subtotal,
          pointsEarned: Math.floor(subtotal * 10),
          items: {
            create: input.items.map((item) => ({
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
      return ctx.db.order.update({
        where: { id: input.id },
        data: { status: input.status },
      });
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
