import { z } from "zod";
import { router, publicProcedure, superAdminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";

const translationSchema = z.object({
  locale: z.enum(["nl", "en"]),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const categoriesRouter = router({
  // Get all categories (public - for menu display)
  getAll: publicProcedure
    .input(
      z.object({
        includeInactive: z.boolean().optional().default(false),
        locale: z.enum(["nl", "en"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const categories = await db.category.findMany({
        where: input?.includeInactive ? {} : { isActive: true },
        include: {
          translations: input?.locale
            ? { where: { locale: input.locale } }
            : true,
          _count: {
            select: { products: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      return categories;
    }),

  // Get single category by ID or slug
  getOne: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        slug: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      if (!input.id && !input.slug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either id or slug must be provided",
        });
      }

      const category = await db.category.findFirst({
        where: input.id ? { id: input.id } : { slug: input.slug },
        include: {
          translations: true,
          _count: {
            select: { products: true },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      return category;
    }),

  // Create category (SUPER_ADMIN only)
  create: superAdminProcedure
    .input(
      z.object({
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
        sortOrder: z.number().int().optional().default(0),
        isActive: z.boolean().optional().default(true),
        imageUrl: z.string().url().optional().nullable(),
        translations: z.array(translationSchema).min(1),
      })
    )
    .mutation(async ({ input }) => {
      // Check if slug already exists
      const existing = await db.category.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A category with this slug already exists",
        });
      }

      const category = await db.category.create({
        data: {
          id: crypto.randomUUID(),
          slug: input.slug,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
          imageUrl: input.imageUrl,
          updatedAt: new Date(),
          translations: {
            create: input.translations.map((t) => ({
              id: crypto.randomUUID(),
              ...t,
            })),
          },
        },
        include: {
          translations: true,
        },
      });

      return category;
    }),

  // Update category (SUPER_ADMIN only)
  update: superAdminProcedure
    .input(
      z.object({
        id: z.string(),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
        imageUrl: z.string().url().optional().nullable(),
        translations: z.array(translationSchema).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, translations, ...data } = input;

      // Check if category exists
      const existing = await db.category.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Check if new slug conflicts with another category
      if (data.slug && data.slug !== existing.slug) {
        const slugConflict = await db.category.findUnique({
          where: { slug: data.slug },
        });

        if (slugConflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A category with this slug already exists",
          });
        }
      }

      // Update category
      const category = await db.category.update({
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
        include: {
          translations: true,
        },
      });

      return category;
    }),

  // Delete category (SUPER_ADMIN only)
  delete: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Check if category exists
      const category = await db.category.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Check if category has products
      if (category._count.products > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete category with ${category._count.products} products. Move or delete the products first.`,
        });
      }

      // Delete category
      await db.category.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Reorder categories (SUPER_ADMIN only)
  reorder: superAdminProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          sortOrder: z.number().int(),
        })
      )
    )
    .mutation(async ({ input }) => {
      await db.$transaction(
        input.map((item) =>
          db.category.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      );

      return { success: true };
    }),
});
