import { z } from "zod";
import { router, publicProcedure, adminProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const newsletterRouter = router({
  // Public: Subscribe from footer (anonymous users)
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        locale: z.string().default("nl"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already subscribed
      const existing = await ctx.db.newsletterSubscriber.findUnique({
        where: { email: input.email.toLowerCase() },
      });

      if (existing) {
        if (existing.status === "ACTIVE") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "already_subscribed",
          });
        }
        // Resubscribe if previously unsubscribed
        if (existing.status === "UNSUBSCRIBED") {
          await ctx.db.newsletterSubscriber.update({
            where: { id: existing.id },
            data: {
              status: "PENDING",
              unsubscribedAt: null,
            },
          });
          // TODO: Send confirmation email
          return { success: true, message: "confirmation_sent" };
        }
        // Already pending
        return { success: true, message: "confirmation_pending" };
      }

      // Check if email belongs to a registered user
      const user = await ctx.db.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });

      if (user) {
        // Update user's newsletter opt-in instead
        await ctx.db.user.update({
          where: { id: user.id },
          data: { newsletterOptIn: true },
        });
        return { success: true, message: "subscribed_as_user" };
      }

      // Create new subscriber (pending confirmation)
      await ctx.db.newsletterSubscriber.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          locale: input.locale,
          status: "PENDING",
          // In production, would capture IP from request headers
        },
      });

      // TODO: Send confirmation email with double opt-in link
      return { success: true, message: "confirmation_sent" };
    }),

  // Public: Confirm subscription (double opt-in)
  confirmSubscription: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const subscriber = await ctx.db.newsletterSubscriber.findUnique({
        where: { unsubscribeToken: input.token },
      });

      if (!subscriber) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "invalid_token",
        });
      }

      if (subscriber.status === "ACTIVE") {
        return { success: true, message: "already_confirmed" };
      }

      await ctx.db.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: {
          status: "ACTIVE",
          consentAt: new Date(),
        },
      });

      return { success: true, message: "subscription_confirmed" };
    }),

  // Public: Unsubscribe
  unsubscribe: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const subscriber = await ctx.db.newsletterSubscriber.findUnique({
        where: { unsubscribeToken: input.token },
      });

      if (!subscriber) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "invalid_token",
        });
      }

      await ctx.db.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: new Date(),
        },
      });

      return { success: true };
    }),

  // Protected: Update newsletter preference for logged-in users
  updatePreference: protectedProcedure
    .input(z.object({ optIn: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { newsletterOptIn: input.optIn },
      });

      return { success: true };
    }),

  // Protected: Get current user's newsletter preference
  getPreference: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { newsletterOptIn: true },
    });

    return { optIn: user?.newsletterOptIn ?? false };
  }),

  // Admin: Get all subscribers (both newsletter subscribers and opted-in users)
  getSubscribers: adminProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "ACTIVE", "UNSUBSCRIBED", "ALL"]).default("ALL"),
        page: z.number().default(1),
        limit: z.number().default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 50;
      const statusFilter = input?.status ?? "ALL";

      // Get newsletter subscribers
      const subscriberWhere = statusFilter === "ALL"
        ? {}
        : { status: statusFilter as "PENDING" | "ACTIVE" | "UNSUBSCRIBED" };

      const [subscribers, subscriberCount] = await Promise.all([
        ctx.db.newsletterSubscriber.findMany({
          where: subscriberWhere,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.newsletterSubscriber.count({ where: subscriberWhere }),
      ]);

      // Get opted-in users
      const [users, userCount] = await Promise.all([
        ctx.db.user.findMany({
          where: { newsletterOptIn: true },
          select: {
            id: true,
            email: true,
            name: true,
            preferredLanguage: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.user.count({ where: { newsletterOptIn: true } }),
      ]);

      return {
        subscribers: subscribers.map((s) => ({
          id: s.id,
          email: s.email,
          name: s.name,
          locale: s.locale,
          status: s.status,
          consentAt: s.consentAt,
          createdAt: s.createdAt,
          source: "subscriber" as const,
        })),
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          locale: u.preferredLanguage,
          status: "ACTIVE" as const,
          consentAt: u.createdAt,
          createdAt: u.createdAt,
          source: "user" as const,
        })),
        stats: {
          totalSubscribers: subscriberCount,
          totalOptedInUsers: userCount,
          totalActive: subscriberCount + userCount,
        },
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(subscriberCount / limit),
        },
      };
    }),

  // Admin: Get subscriber stats
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      pendingCount,
      activeCount,
      unsubscribedCount,
      optedInUsers,
    ] = await Promise.all([
      ctx.db.newsletterSubscriber.count({ where: { status: "PENDING" } }),
      ctx.db.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
      ctx.db.newsletterSubscriber.count({ where: { status: "UNSUBSCRIBED" } }),
      ctx.db.user.count({ where: { newsletterOptIn: true } }),
    ]);

    // Recent subscribers (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentSubscribers = await ctx.db.newsletterSubscriber.count({
      where: {
        createdAt: { gte: weekAgo },
        status: "ACTIVE",
      },
    });

    return {
      pending: pendingCount,
      active: activeCount,
      unsubscribed: unsubscribedCount,
      optedInUsers,
      totalActive: activeCount + optedInUsers,
      recentSubscribers,
    };
  }),

  // Admin: Get all campaigns
  getCampaigns: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;

      const [campaigns, total] = await Promise.all([
        ctx.db.newsletterCampaign.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.newsletterCampaign.count(),
      ]);

      return {
        campaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Admin: Create campaign (draft)
  createCampaign: adminProcedure
    .input(
      z.object({
        subject: z.string().min(1),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.newsletterCampaign.create({
        data: {
          subject: input.subject,
          content: input.content,
        },
      });

      return campaign;
    }),

  // Admin: Update campaign
  updateCampaign: adminProcedure
    .input(
      z.object({
        id: z.string(),
        subject: z.string().min(1),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.newsletterCampaign.findUnique({
        where: { id: input.id },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "campaign_not_found",
        });
      }

      if (campaign.sentAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "cannot_edit_sent_campaign",
        });
      }

      return ctx.db.newsletterCampaign.update({
        where: { id: input.id },
        data: {
          subject: input.subject,
          content: input.content,
        },
      });
    }),

  // Admin: Delete campaign
  deleteCampaign: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.newsletterCampaign.findUnique({
        where: { id: input.id },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "campaign_not_found",
        });
      }

      await ctx.db.newsletterCampaign.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Admin: Send campaign (placeholder - would integrate with email service)
  sendCampaign: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.newsletterCampaign.findUnique({
        where: { id: input.id },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "campaign_not_found",
        });
      }

      if (campaign.sentAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "campaign_already_sent",
        });
      }

      // Get all active subscribers
      const [subscribers, users] = await Promise.all([
        ctx.db.newsletterSubscriber.findMany({
          where: { status: "ACTIVE" },
          select: { email: true, name: true, locale: true },
        }),
        ctx.db.user.findMany({
          where: { newsletterOptIn: true },
          select: { email: true, name: true, preferredLanguage: true },
        }),
      ]);

      const allRecipients = [
        ...subscribers.map((s) => ({ email: s.email, name: s.name, locale: s.locale })),
        ...users.map((u) => ({ email: u.email, name: u.name, locale: u.preferredLanguage })),
      ];

      // Remove duplicates
      const uniqueRecipients = Array.from(
        new Map(allRecipients.map((r) => [r.email, r])).values()
      );

      // TODO: Integrate with email service (Resend, SendGrid, etc.)
      // For now, just mark as sent
      console.log(`Would send campaign "${campaign.subject}" to ${uniqueRecipients.length} recipients`);

      await ctx.db.newsletterCampaign.update({
        where: { id: input.id },
        data: {
          sentAt: new Date(),
          sentCount: uniqueRecipients.length,
        },
      });

      return {
        success: true,
        recipientCount: uniqueRecipients.length,
      };
    }),

  // Admin: Export subscribers as CSV
  exportSubscribers: adminProcedure.query(async ({ ctx }) => {
    const [subscribers, users] = await Promise.all([
      ctx.db.newsletterSubscriber.findMany({
        where: { status: "ACTIVE" },
        select: {
          email: true,
          name: true,
          locale: true,
          consentAt: true,
          createdAt: true,
        },
      }),
      ctx.db.user.findMany({
        where: { newsletterOptIn: true },
        select: {
          email: true,
          name: true,
          preferredLanguage: true,
          createdAt: true,
        },
      }),
    ]);

    const allRecipients = [
      ...subscribers.map((s) => ({
        email: s.email,
        name: s.name || "",
        locale: s.locale,
        consentAt: s.consentAt?.toISOString() || s.createdAt.toISOString(),
        source: "subscriber",
      })),
      ...users.map((u) => ({
        email: u.email,
        name: u.name || "",
        locale: u.preferredLanguage,
        consentAt: u.createdAt.toISOString(),
        source: "user",
      })),
    ];

    // Remove duplicates
    const uniqueRecipients = Array.from(
      new Map(allRecipients.map((r) => [r.email, r])).values()
    );

    return uniqueRecipients;
  }),
});
