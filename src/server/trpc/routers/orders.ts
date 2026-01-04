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
        include: { items: { include: { product: true } }, user: true },
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

    const orders = await ctx.db.order.findMany({
      where: { createdAt: { gte: today } },
    });

    return {
      count: orders.length,
      revenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
      pending: orders.filter((o) => ["PENDING", "PAID", "PREPARING"].includes(o.status)).length,
    };
  }),
});
