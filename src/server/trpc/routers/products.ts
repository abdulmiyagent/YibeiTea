import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc";

export const productsRouter = router({
  getAll: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        locale: z.enum(["nl", "en"]).default("nl"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.product.findMany({
        where: input?.category ? { category: input.category as any } : undefined,
        include: {
          translations: {
            where: { locale: input?.locale || "nl" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return products;
    }),

  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
      locale: z.enum(["nl", "en"]).default("nl"),
    }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { slug: input.slug },
        include: {
          translations: { where: { locale: input.locale } },
          customizationOptions: {
            include: { translations: { where: { locale: input.locale } } },
          },
        },
      });
      return product;
    }),

  getFeatured: publicProcedure
    .input(z.object({
      locale: z.enum(["nl", "en"]).default("nl"),
      limit: z.number().default(6),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findMany({
        where: { isFeatured: true, isAvailable: true },
        include: { translations: { where: { locale: input?.locale || "nl" } } },
        take: input?.limit || 6,
      });
    }),

  create: adminProcedure
    .input(z.object({
      slug: z.string(),
      category: z.enum(["BUBBLE_TEA", "MILK_TEA", "ICED_TEA", "ICED_COFFEE", "MOJITO", "SEASONAL"]),
      price: z.number().positive(),
      imageUrl: z.string().optional(),
      isAvailable: z.boolean().default(true),
      isFeatured: z.boolean().default(false),
      translations: z.array(z.object({
        locale: z.enum(["nl", "en"]),
        name: z.string(),
        description: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { translations, ...data } = input;
      return ctx.db.product.create({
        data: { ...data, translations: { create: translations } },
        include: { translations: true },
      });
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      slug: z.string().optional(),
      price: z.number().positive().optional(),
      isAvailable: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.product.update({ where: { id }, data });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.product.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
