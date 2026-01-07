import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const promoCodesRouter = router({
  // Validate and get promo code details (for checkout)
  validate: publicProcedure
    .input(z.object({
      code: z.string(),
      orderAmount: z.number().positive(),
    }))
    .query(async ({ ctx, input }) => {
      const promoCode = await ctx.db.promoCode.findUnique({
        where: { code: input.code.toUpperCase() },
      });

      if (!promoCode) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ongeldige promotiecode",
        });
      }

      // Check if active
      if (!promoCode.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deze promotiecode is niet meer actief",
        });
      }

      // Check validity period
      const now = new Date();
      if (now < promoCode.validFrom) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deze promotiecode is nog niet geldig",
        });
      }
      if (now > promoCode.validUntil) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deze promotiecode is verlopen",
        });
      }

      // Check max uses
      if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deze promotiecode is al volledig gebruikt",
        });
      }

      // Check minimum order amount
      if (promoCode.minOrderAmount && input.orderAmount < Number(promoCode.minOrderAmount)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Minimaal bestelbedrag is €${Number(promoCode.minOrderAmount).toFixed(2)}`,
        });
      }

      // Calculate discount
      let discountAmount: number;
      if (promoCode.discountType === "PERCENTAGE") {
        discountAmount = (input.orderAmount * Number(promoCode.discountValue)) / 100;
      } else {
        discountAmount = Number(promoCode.discountValue);
      }

      // Ensure discount doesn't exceed order amount
      discountAmount = Math.min(discountAmount, input.orderAmount);

      return {
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: Number(promoCode.discountValue),
        discountAmount: Math.round(discountAmount * 100) / 100,
        minOrderAmount: promoCode.minOrderAmount ? Number(promoCode.minOrderAmount) : null,
      };
    }),

  // Admin: Get all promo codes
  getAll: adminProcedure.query(async ({ ctx }) => {
    const promoCodes = await ctx.db.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return promoCodes.map((code) => ({
      id: code.id,
      code: code.code,
      discountType: code.discountType,
      discountValue: Number(code.discountValue),
      minOrderAmount: code.minOrderAmount ? Number(code.minOrderAmount) : null,
      maxUses: code.maxUses,
      usedCount: code.usedCount,
      validFrom: code.validFrom,
      validUntil: code.validUntil,
      isActive: code.isActive,
    }));
  }),

  // Admin: Create promo code
  create: adminProcedure
    .input(z.object({
      code: z.string().min(3).max(20),
      discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
      discountValue: z.number().positive(),
      minOrderAmount: z.number().positive().optional(),
      maxUses: z.number().positive().optional(),
      validFrom: z.string(),
      validUntil: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if code already exists
      const existing = await ctx.db.promoCode.findUnique({
        where: { code: input.code.toUpperCase() },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Deze promotiecode bestaat al",
        });
      }

      return ctx.db.promoCode.create({
        data: {
          id: crypto.randomUUID(),
          code: input.code.toUpperCase(),
          discountType: input.discountType,
          discountValue: input.discountValue,
          minOrderAmount: input.minOrderAmount,
          maxUses: input.maxUses,
          validFrom: new Date(input.validFrom),
          validUntil: new Date(input.validUntil),
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }),

  // Admin: Update promo code
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
      discountValue: z.number().positive().optional(),
      minOrderAmount: z.number().positive().nullable().optional(),
      maxUses: z.number().positive().nullable().optional(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      return ctx.db.promoCode.update({
        where: { id },
        data: {
          ...data,
          validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
          validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        },
      });
    }),

  // Admin: Delete promo code
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.promoCode.delete({
        where: { id: input.id },
      });
    }),
});
