import { z } from "zod";
import { router, publicProcedure, superAdminProcedure } from "../trpc";

// Default social links
const defaultSocialLinks = [
  { platform: "instagram", href: "https://instagram.com/yibeitea", isActive: true },
  { platform: "tiktok", href: "https://tiktok.com/@yibeitea", isActive: true },
  { platform: "facebook", href: "https://facebook.com/yibeitea", isActive: true },
  { platform: "email", href: "mailto:info@yibeitea.be", isActive: true },
];

export const storeSettingsRouter = router({
  // Get store settings (public - needed for checkout)
  get: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.storeSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      // Return defaults if not found
      return {
        id: "default",
        openingHours: {
          monday: { open: "11:00", close: "20:00" },
          tuesday: { open: "11:00", close: "20:00" },
          wednesday: { open: "11:00", close: "20:00" },
          thursday: { open: "11:00", close: "20:00" },
          friday: { open: "11:00", close: "20:00" },
          saturday: { open: "11:00", close: "20:00" },
          sunday: { open: "10:00", close: "19:00" },
        },
        minPickupMinutes: 15,
        maxAdvanceOrderDays: 7,
        pointsPerEuro: 10,
        socialLinks: defaultSocialLinks,
      };
    }

    return {
      ...settings,
      socialLinks: settings.socialLinks || defaultSocialLinks,
    };
  }),

  // Update store settings (SUPER_ADMIN only)
  update: superAdminProcedure
    .input(
      z.object({
        openingHours: z
          .record(
            z.object({
              open: z.string(),
              close: z.string(),
            })
          )
          .optional(),
        minPickupMinutes: z.number().int().min(5).max(120).optional(),
        maxAdvanceOrderDays: z.number().int().min(1).max(30).optional(),
        pointsPerEuro: z.number().int().min(1).max(100).optional(),
        socialLinks: z
          .array(
            z.object({
              platform: z.string(),
              href: z.string(),
              isActive: z.boolean(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.storeSettings.upsert({
        where: { id: "default" },
        update: {
          ...input,
          updatedAt: new Date(),
        },
        create: {
          id: "default",
          openingHours: input.openingHours || {
            monday: { open: "11:00", close: "20:00" },
            tuesday: { open: "11:00", close: "20:00" },
            wednesday: { open: "11:00", close: "20:00" },
            thursday: { open: "11:00", close: "20:00" },
            friday: { open: "11:00", close: "20:00" },
            saturday: { open: "11:00", close: "20:00" },
            sunday: { open: "10:00", close: "19:00" },
          },
          minPickupMinutes: input.minPickupMinutes || 15,
          maxAdvanceOrderDays: input.maxAdvanceOrderDays || 7,
          pointsPerEuro: input.pointsPerEuro || 10,
          socialLinks: input.socialLinks || defaultSocialLinks,
          updatedAt: new Date(),
        },
      });
    }),
});
