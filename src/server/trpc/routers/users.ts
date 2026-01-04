import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { calculateLoyaltyTier } from "@/lib/utils";

export const usersRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        favorites: { include: { product: true } },
        loyaltyTransactions: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      dateOfBirth: z.string().optional(),
      preferredLanguage: z.enum(["nl", "en"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...input,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        },
      });
    }),

  addFavorite: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.favorite.create({
        data: { userId: ctx.session.user.id, productId: input.productId },
      });
    }),

  removeFavorite: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.favorite.delete({
        where: {
          userId_productId: { userId: ctx.session.user.id, productId: input.productId },
        },
      });
    }),

  getLoyaltyInfo: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { loyaltyPoints: true, loyaltyTier: true },
    });

    const transactions = await ctx.db.loyaltyTransaction.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return { ...user, transactions };
  }),

  // Admin routes
  getAll: adminProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findMany({
        include: { _count: { select: { orders: true } } },
        orderBy: { createdAt: "desc" },
        take: input?.limit || 50,
      });
    }),

  addLoyaltyPoints: adminProcedure
    .input(z.object({
      userId: z.string(),
      points: z.number(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({ where: { id: input.userId } });
      if (!user) throw new Error("User not found");

      const newPoints = user.loyaltyPoints + input.points;
      const newTier = calculateLoyaltyTier(newPoints);

      await ctx.db.loyaltyTransaction.create({
        data: {
          userId: input.userId,
          points: input.points,
          type: input.points > 0 ? "BONUS" : "ADJUSTMENT",
          description: input.description,
        },
      });

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { loyaltyPoints: newPoints, loyaltyTier: newTier },
      });
    }),
});
