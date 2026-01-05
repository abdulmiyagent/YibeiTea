import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc";

export const customizationsRouter = router({
  // Public: Get all active customization groups with their values
  getAll: publicProcedure
    .input(
      z.object({
        locale: z.enum(["nl", "en"]).default("nl"),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.customizationGroup.findMany({
        where: { isActive: true },
        include: {
          values: {
            where: { isAvailable: true },
            include: {
              translations: { where: { locale: input.locale } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });
    }),

  // Admin: Get all groups including inactive ones
  getAllAdmin: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.customizationGroup.findMany({
      include: {
        values: {
          include: { translations: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  }),

  // Admin: Update group settings
  updateGroup: adminProcedure
    .input(
      z.object({
        type: z.enum(["SUGAR_LEVEL", "ICE_LEVEL", "SIZE", "MILK_TYPE"]),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { type, ...data } = input;
      return ctx.db.customizationGroup.update({
        where: { type },
        data,
      });
    }),

  // Admin: Create a new value in a group
  createValue: adminProcedure
    .input(
      z.object({
        groupType: z.enum(["SUGAR_LEVEL", "ICE_LEVEL", "SIZE", "MILK_TYPE"]),
        value: z.string(),
        priceModifier: z.number().default(0),
        isDefault: z.boolean().default(false),
        isAvailable: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
        translations: z.array(
          z.object({
            locale: z.enum(["nl", "en"]),
            label: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.customizationGroup.findUnique({
        where: { type: input.groupType },
      });
      if (!group) throw new Error("Group not found");

      // If this is set as default, unset other defaults in the group
      if (input.isDefault) {
        await ctx.db.customizationValue.updateMany({
          where: { groupId: group.id },
          data: { isDefault: false },
        });
      }

      return ctx.db.customizationValue.create({
        data: {
          groupId: group.id,
          value: input.value,
          priceModifier: input.priceModifier,
          isDefault: input.isDefault,
          isAvailable: input.isAvailable,
          sortOrder: input.sortOrder,
          translations: { create: input.translations },
        },
        include: { translations: true },
      });
    }),

  // Admin: Update a value
  updateValue: adminProcedure
    .input(
      z.object({
        id: z.string(),
        value: z.string().optional(),
        priceModifier: z.number().optional(),
        isDefault: z.boolean().optional(),
        isAvailable: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        translations: z
          .array(
            z.object({
              locale: z.enum(["nl", "en"]),
              label: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, translations, isDefault, ...data } = input;

      // If setting as default, unset other defaults in the same group
      if (isDefault) {
        const currentValue = await ctx.db.customizationValue.findUnique({
          where: { id },
          select: { groupId: true },
        });
        if (currentValue) {
          await ctx.db.customizationValue.updateMany({
            where: { groupId: currentValue.groupId },
            data: { isDefault: false },
          });
        }
      }

      return ctx.db.customizationValue.update({
        where: { id },
        data: {
          ...data,
          isDefault,
          ...(translations && {
            translations: {
              deleteMany: {},
              create: translations,
            },
          }),
        },
        include: { translations: true },
      });
    }),

  // Admin: Delete a value (SUPER_ADMIN only handled in frontend)
  deleteValue: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.customizationValue.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Admin: Reorder values within a group
  reorderValues: adminProcedure
    .input(
      z.object({
        groupType: z.enum(["SUGAR_LEVEL", "ICE_LEVEL", "SIZE", "MILK_TYPE"]),
        valueIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates = input.valueIds.map((id, index) =>
        ctx.db.customizationValue.update({
          where: { id },
          data: { sortOrder: index },
        })
      );
      await ctx.db.$transaction(updates);
      return { success: true };
    }),
});
