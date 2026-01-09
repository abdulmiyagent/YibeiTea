import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc";

export const toppingsRouter = router({
  getAll: publicProcedure
    .input(
      z.object({
        locale: z.enum(["nl", "en", "ne"]).default("nl"),
        onlyAvailable: z.boolean().default(true),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.topping.findMany({
        where: {
          ...(input?.onlyAvailable && { isAvailable: true }),
        },
        include: {
          translations: input?.locale
            ? { where: { locale: input.locale } }
            : true,
        },
        orderBy: { sortOrder: "asc" },
      });
    }),

  getById: publicProcedure
    .input(z.object({
      id: z.string(),
      locale: z.enum(["nl", "en", "ne"]).default("nl"),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.topping.findUnique({
        where: { id: input.id },
        include: {
          translations: { where: { locale: input.locale } },
        },
      });
    }),

  create: adminProcedure
    .input(z.object({
      slug: z.string(),
      price: z.number().min(0),
      isAvailable: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
      translations: z.array(z.object({
        locale: z.enum(["nl", "en", "ne"]),
        name: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { translations, ...data } = input;
      return ctx.db.topping.create({
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

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      slug: z.string().optional(),
      price: z.number().min(0).optional(),
      isAvailable: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
      translations: z.array(z.object({
        locale: z.enum(["nl", "en", "ne"]),
        name: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, translations, ...data } = input;
      return ctx.db.topping.update({
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

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.topping.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
