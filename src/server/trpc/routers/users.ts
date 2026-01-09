import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { calculateLoyaltyTier } from "@/lib/utils";

export const usersRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        favorites: { include: { Product: true } },
        loyaltyTransactions: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      dateOfBirth: z.string().optional(),
      preferredLanguage: z.enum(["nl", "en", "ne"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...input,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        },
      });
    }),

  addFavorite: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.favorite.create({
        data: { userId: ctx.session.user.id, productId: input.productId },
      });
    }),

  removeFavorite: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.favorite.delete({
        where: {
          userId_productId: { userId: ctx.session.user.id, productId: input.productId },
        },
      });
    }),

  getFavorites: protectedProcedure
    .input(z.object({ locale: z.enum(["nl", "en", "ne"]) }))
    .query(async ({ ctx, input }) => {
      const favorites = await ctx.db.favorite.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          Product: {
            include: {
              translations: { where: { locale: input.locale } },
              category: {
                include: { translations: { where: { locale: input.locale } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return favorites.map((fav) => fav.Product);
    }),

  getLoyaltyInfo: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { loyaltyPoints: true, loyaltyTier: true },
    });

    const transactions = await ctx.db.loyaltyTransaction.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return { ...user, transactions };
  }),

  // Admin routes
  getAll: adminProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findMany({
        include: { _count: { select: { orders: true } } },
        orderBy: { createdAt: "desc" },
        take: input?.limit || 50,
      });
    }),

  getCustomerCount: adminProcedure.query(async ({ ctx }) => {
    const total = await ctx.db.user.count({
      where: { role: "USER" },
    });

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const newThisWeek = await ctx.db.user.count({
      where: {
        role: "USER",
        createdAt: { gte: thisWeek },
      },
    });

    return { total, newThisWeek };
  }),

  addLoyaltyPoints: adminProcedure
    .input(z.object({
      userId: z.string(),
      points: z.number(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({ where: { id: input.userId } });
      if (!user) throw new Error("User not found");

      const newPoints = user.loyaltyPoints + input.points;
      const newTier = calculateLoyaltyTier(newPoints);

      await ctx.db.loyaltyTransaction.create({
        data: {
          id: crypto.randomUUID(),
          userId: input.userId,
          points: input.points,
          type: input.points > 0 ? "BONUS" : "ADJUSTMENT",
          description: input.description,
        },
      });

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { loyaltyPoints: newPoints, loyaltyTier: newTier },
      });
    }),

  // GDPR: Export user data (Right to Data Portability - Art. 20)
  exportData: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        addresses: true,
        favorites: {
          include: {
            Product: {
              include: { translations: true },
            },
          },
        },
        loyaltyTransactions: {
          orderBy: { createdAt: "desc" },
        },
        orders: {
          include: {
            items: {
              include: {
                product: {
                  include: { translations: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        reviews: true,
      },
    });

    if (!user) throw new Error("User not found");

    // Format data for export (exclude sensitive internal fields)
    return {
      exportedAt: new Date().toISOString(),
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        preferredLanguage: user.preferredLanguage,
        createdAt: user.createdAt,
      },
      loyalty: {
        points: user.loyaltyPoints,
        tier: user.loyaltyTier,
        transactions: user.loyaltyTransactions.map((t) => ({
          type: t.type,
          points: t.points,
          description: t.description,
          date: t.createdAt,
        })),
      },
      addresses: user.addresses.map((a) => ({
        name: a.name,
        street: a.street,
        city: a.city,
        postalCode: a.postalCode,
        country: a.country,
        isDefault: a.isDefault,
      })),
      favorites: user.favorites.map((f) => ({
        productName: f.Product.translations[0]?.name || f.Product.slug,
        addedAt: f.createdAt,
      })),
      orders: user.orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        total: Number(o.total),
        pointsEarned: o.pointsEarned,
        pointsRedeemed: o.pointsRedeemed,
        pickupTime: o.pickupTime,
        createdAt: o.createdAt,
        items: o.items.map((i) => ({
          productName: i.product.translations[0]?.name || i.product.slug,
          quantity: i.quantity,
          price: Number(i.unitPrice),
          customizations: i.customizations,
        })),
      })),
      reviews: user.reviews.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    };
  }),

  // GDPR: Delete account (Right to Erasure - Art. 17)
  deleteAccount: protectedProcedure
    .input(z.object({
      confirmEmail: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user) throw new Error("User not found");

      // Verify email matches for confirmation
      if (user.email.toLowerCase() !== input.confirmEmail.toLowerCase()) {
        throw new Error("Email does not match. Please enter your email correctly to confirm deletion.");
      }

      // Anonymize orders (keep for accounting, but remove personal data)
      await ctx.db.order.updateMany({
        where: { userId: ctx.session.user.id },
        data: {
          userId: null,
          customerName: "Deleted User",
          customerEmail: null,
          customerPhone: null,
          notes: null,
        },
      });

      // Delete user (cascades to: accounts, sessions, addresses, favorites, loyaltyTransactions, reviews)
      await ctx.db.user.delete({
        where: { id: ctx.session.user.id },
      });

      return { success: true };
    }),
});
