import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { calculateLoyaltyTier } from "@/lib/utils";

export const rewardsRouter = router({
  // Get all available rewards
  getAll: publicProcedure
    .input(z.object({ locale: z.enum(["nl", "en", "ne"]).default("nl") }))
    .query(async ({ ctx, input }) => {
      const rewards = await ctx.db.reward.findMany({
        where: { isAvailable: true },
        include: {
          translations: {
            where: { locale: input.locale },
          },
        },
        orderBy: { pointsCost: "asc" },
      });

      return rewards.map((reward) => ({
        id: reward.id,
        slug: reward.slug,
        pointsCost: reward.pointsCost,
        rewardType: reward.rewardType,
        rewardValue: Number(reward.rewardValue),
        name: reward.translations[0]?.name || reward.slug,
        description: reward.translations[0]?.description || "",
      }));
    }),

  // Redeem a reward
  redeem: protectedProcedure
    .input(z.object({ rewardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get the reward
      const reward = await ctx.db.reward.findUnique({
        where: { id: input.rewardId },
        include: { translations: true },
      });

      if (!reward) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reward niet gevonden",
        });
      }

      if (!reward.isAvailable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deze beloning is niet meer beschikbaar",
        });
      }

      // Get user's current points
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { loyaltyPoints: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gebruiker niet gevonden",
        });
      }

      // Check if user has enough points
      if (user.loyaltyPoints < reward.pointsCost) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Je hebt niet genoeg punten. Je hebt ${user.loyaltyPoints} punten, maar deze beloning kost ${reward.pointsCost} punten.`,
        });
      }

      // Calculate new points and tier
      const newPoints = user.loyaltyPoints - reward.pointsCost;
      const newTier = calculateLoyaltyTier(newPoints);

      // Create transaction and update user in a transaction
      const rewardName = reward.translations[0]?.name || reward.slug;

      await ctx.db.$transaction([
        // Create loyalty transaction (negative points for redemption)
        ctx.db.loyaltyTransaction.create({
          data: {
            id: crypto.randomUUID(),
            userId: ctx.session.user.id,
            type: "REDEEM",
            points: -reward.pointsCost,
            description: `Ingewisseld: ${rewardName}`,
          },
        }),
        // Update user points
        ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: {
            loyaltyPoints: newPoints,
            loyaltyTier: newTier,
          },
        }),
      ]);

      return {
        success: true,
        message: `Je hebt "${rewardName}" ingewisseld!`,
        newPoints,
        newTier,
        reward: {
          name: rewardName,
          type: reward.rewardType,
          value: Number(reward.rewardValue),
        },
      };
    }),

  // Get user's redemption history
  getMyRedemptions: protectedProcedure.query(async ({ ctx }) => {
    const redemptions = await ctx.db.loyaltyTransaction.findMany({
      where: {
        userId: ctx.session.user.id,
        type: "REDEEM",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return redemptions;
  }),

  // Admin: Get all rewards including inactive
  getAllAdmin: adminProcedure.query(async ({ ctx }) => {
    const rewards = await ctx.db.reward.findMany({
      include: { translations: true },
      orderBy: { pointsCost: "asc" },
    });

    return rewards.map((reward) => ({
      id: reward.id,
      slug: reward.slug,
      pointsCost: reward.pointsCost,
      rewardType: reward.rewardType,
      rewardValue: Number(reward.rewardValue),
      isAvailable: reward.isAvailable,
      translations: reward.translations,
    }));
  }),

  // Admin: Create reward
  create: adminProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        pointsCost: z.number().int().positive(),
        rewardType: z.enum(["DISCOUNT", "FREE_DRINK", "FREE_TOPPING", "SIZE_UPGRADE"]),
        rewardValue: z.number().positive(),
        isAvailable: z.boolean().default(true),
        translations: z.array(
          z.object({
            locale: z.enum(["nl", "en", "ne"]),
            name: z.string(),
            description: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { translations, ...data } = input;
      return ctx.db.reward.create({
        data: {
          id: crypto.randomUUID(),
          ...data,
          updatedAt: new Date(),
          translations: {
            create: translations.map((t) => ({
              id: crypto.randomUUID(),
              ...t,
            })),
          },
        },
        include: { translations: true },
      });
    }),

  // Admin: Update reward
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        slug: z.string().optional(),
        pointsCost: z.number().int().positive().optional(),
        rewardType: z.enum(["DISCOUNT", "FREE_DRINK", "FREE_TOPPING", "SIZE_UPGRADE"]).optional(),
        rewardValue: z.number().positive().optional(),
        isAvailable: z.boolean().optional(),
        translations: z
          .array(
            z.object({
              locale: z.enum(["nl", "en", "ne"]),
              name: z.string(),
              description: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, translations, ...data } = input;
      return ctx.db.reward.update({
        where: { id },
        data: {
          ...data,
          ...(translations && {
            translations: {
              deleteMany: {},
              create: translations.map((t) => ({
                id: crypto.randomUUID(),
                ...t,
              })),
            },
          }),
        },
        include: { translations: true },
      });
    }),

  // Admin: Delete reward
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.reward.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
