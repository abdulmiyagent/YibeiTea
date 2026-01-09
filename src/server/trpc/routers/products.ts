import { z } from "zod";
import { router, publicProcedure, adminProcedure, superAdminProcedure } from "../trpc";

export const productsRouter = router({
  getAll: publicProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        categorySlug: z.string().optional(),
        locale: z.enum(["nl", "en", "ne"]).default("nl"),
        onlyAvailable: z.boolean().default(true),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.product.findMany({
        where: {
          ...(input?.categoryId && { categoryId: input.categoryId }),
          ...(input?.categorySlug && { category: { slug: input.categorySlug } }),
          ...(input?.onlyAvailable && { isAvailable: true }),
        },
        include: {
          translations: input?.locale
            ? { where: { locale: input.locale } }
            : true,
          category: {
            include: {
              translations: input?.locale
                ? { where: { locale: input.locale } }
                : true,
            },
          },
        },
        orderBy: [
          { category: { sortOrder: "asc" } },
          { sortOrder: "asc" },
        ],
      });
      return products;
    }),

  getById: publicProcedure
    .input(z.object({
      id: z.string(),
      locale: z.enum(["nl", "en", "ne"]).default("nl"),
    }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: {
          translations: { where: { locale: input.locale } },
          category: {
            include: {
              translations: { where: { locale: input.locale } },
            },
          },
        },
      });
      return product;
    }),

  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
      locale: z.enum(["nl", "en", "ne"]).default("nl"),
    }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { slug: input.slug },
        include: {
          translations: { where: { locale: input.locale } },
          category: {
            include: {
              translations: { where: { locale: input.locale } },
            },
          },
          customizationOptions: {
            include: { translations: { where: { locale: input.locale } } },
          },
        },
      });
      return product;
    }),

  getFeatured: publicProcedure
    .input(z.object({
      locale: z.enum(["nl", "en", "ne"]).default("nl"),
      limit: z.number().default(6),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findMany({
        where: { isFeatured: true, isAvailable: true },
        include: {
          translations: { where: { locale: input?.locale || "nl" } },
          category: {
            include: {
              translations: { where: { locale: input?.locale || "nl" } },
            },
          },
        },
        take: input?.limit || 6,
        orderBy: { sortOrder: "asc" },
      });
    }),

  getByCategory: publicProcedure
    .input(z.object({
      categorySlug: z.string(),
      locale: z.enum(["nl", "en", "ne"]).default("nl"),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findMany({
        where: {
          category: { slug: input.categorySlug },
          isAvailable: true,
        },
        include: {
          translations: { where: { locale: input.locale } },
          category: {
            include: {
              translations: { where: { locale: input.locale } },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      });
    }),

  create: superAdminProcedure
    .input(z.object({
      slug: z.string(),
      categoryId: z.string(),
      price: z.number().positive(),
      imageUrl: z.string().optional(),
      isAvailable: z.boolean().default(true),
      isFeatured: z.boolean().default(false),
      sortOrder: z.number().int().default(0),
      caffeine: z.boolean().default(true),
      vegan: z.boolean().default(false),
      calories: z.number().int().optional(),
      allowSugarCustomization: z.boolean().default(true),
      allowIceCustomization: z.boolean().default(true),
      allowToppings: z.boolean().default(true),
      translations: z.array(z.object({
        locale: z.enum(["nl", "en", "ne"]),
        name: z.string(),
        description: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { translations, ...data } = input;
      return ctx.db.product.create({
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
        include: { translations: true, category: true },
      });
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      slug: z.string().optional(),
      categoryId: z.string().optional(),
      price: z.number().positive().optional(),
      imageUrl: z.string().optional().nullable(),
      isAvailable: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
      caffeine: z.boolean().optional(),
      vegan: z.boolean().optional(),
      calories: z.number().int().optional().nullable(),
      allowSugarCustomization: z.boolean().optional(),
      allowIceCustomization: z.boolean().optional(),
      allowToppings: z.boolean().optional(),
      translations: z.array(z.object({
        locale: z.enum(["nl", "en", "ne"]),
        name: z.string(),
        description: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, translations, categoryId, ...data } = input;
      return ctx.db.product.update({
        where: { id },
        data: {
          ...data,
          ...(categoryId && { category: { connect: { id: categoryId } } }),
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
        include: { translations: true, category: true },
      });
    }),

  delete: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.product.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
