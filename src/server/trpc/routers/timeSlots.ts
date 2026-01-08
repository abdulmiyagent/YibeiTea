import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc";

export const timeSlotsRouter = router({
  // Public: Get slot availability for a given date
  getAvailability: publicProcedure
    .input(
      z.object({
        date: z.string(), // ISO date string (YYYY-MM-DD)
      })
    )
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setHours(0, 0, 0, 0);

      // Get store settings for default capacity
      const settings = await ctx.db.storeSettings.findUnique({
        where: { id: "default" },
      });
      const defaultCapacity = settings?.slotsPerTimeWindow ?? 10;

      // Get overrides for this date
      const overrides = await ctx.db.timeSlotOverride.findMany({
        where: {
          date: date,
        },
      });

      // Get order counts for each time slot on this date
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const orders = await ctx.db.order.findMany({
        where: {
          pickupTime: {
            gte: startOfDay,
            lt: endOfDay,
          },
          status: {
            notIn: ["CANCELLED"],
          },
        },
        select: {
          pickupTime: true,
        },
      });

      // Count orders per time slot
      const orderCounts: Record<string, number> = {};
      orders.forEach((order) => {
        if (order.pickupTime) {
          const time = order.pickupTime.toISOString().slice(11, 16); // HH:MM
          orderCounts[time] = (orderCounts[time] || 0) + 1;
        }
      });

      // Build override map
      const overrideMap: Record<string, { isDisabled: boolean; maxCapacity: number | null; reason: string | null }> = {};
      overrides.forEach((override) => {
        overrideMap[override.time] = {
          isDisabled: override.isDisabled,
          maxCapacity: override.maxCapacity,
          reason: override.reason,
        };
      });

      return {
        defaultCapacity,
        orderCounts,
        overrides: overrideMap,
      };
    }),

  // Admin: Get all overrides for a date range
  getOverrides: adminProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(input.endDate);
      endDate.setHours(23, 59, 59, 999);

      return ctx.db.timeSlotOverride.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: [{ date: "asc" }, { time: "asc" }],
      });
    }),

  // Admin: Create or update a slot override
  upsertOverride: adminProcedure
    .input(
      z.object({
        date: z.string(), // ISO date string (YYYY-MM-DD)
        time: z.string(), // HH:MM format
        isDisabled: z.boolean().optional(),
        maxCapacity: z.number().int().min(0).nullable().optional(),
        reason: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setHours(0, 0, 0, 0);

      return ctx.db.timeSlotOverride.upsert({
        where: {
          date_time: {
            date: date,
            time: input.time,
          },
        },
        update: {
          isDisabled: input.isDisabled ?? false,
          maxCapacity: input.maxCapacity,
          reason: input.reason,
        },
        create: {
          date: date,
          time: input.time,
          isDisabled: input.isDisabled ?? false,
          maxCapacity: input.maxCapacity,
          reason: input.reason,
        },
      });
    }),

  // Admin: Delete a slot override (revert to default)
  deleteOverride: adminProcedure
    .input(
      z.object({
        date: z.string(),
        time: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setHours(0, 0, 0, 0);

      await ctx.db.timeSlotOverride.delete({
        where: {
          date_time: {
            date: date,
            time: input.time,
          },
        },
      });

      return { success: true };
    }),

  // Admin: Bulk disable slots (e.g., for a busy day)
  bulkDisableSlots: adminProcedure
    .input(
      z.object({
        date: z.string(),
        times: z.array(z.string()),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setHours(0, 0, 0, 0);

      const operations = input.times.map((time) =>
        ctx.db.timeSlotOverride.upsert({
          where: {
            date_time: {
              date: date,
              time: time,
            },
          },
          update: {
            isDisabled: true,
            reason: input.reason || "Disabled by admin",
          },
          create: {
            date: date,
            time: time,
            isDisabled: true,
            reason: input.reason || "Disabled by admin",
          },
        })
      );

      await ctx.db.$transaction(operations);
      return { success: true };
    }),

  // Admin: Enable all slots for a date (remove all disabling overrides)
  enableAllSlots: adminProcedure
    .input(
      z.object({
        date: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setHours(0, 0, 0, 0);

      await ctx.db.timeSlotOverride.deleteMany({
        where: {
          date: date,
          isDisabled: true,
        },
      });

      return { success: true };
    }),
});
