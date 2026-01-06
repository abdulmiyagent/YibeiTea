import { z } from "zod";
import { router, adminProcedure } from "../trpc";

export const analyticsRouter = router({
  // Revenue and orders over time (last 30 days)
  getRevenueOverTime: adminProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const days = input?.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const orders = await ctx.db.order.findMany({
        where: {
          createdAt: { gte: startDate },
          status: { not: "CANCELLED" },
        },
        select: {
          createdAt: true,
          total: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by day
      const dailyData: Record<string, { revenue: number; orders: number }> = {};

      // Initialize all days with 0
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const key = date.toISOString().split("T")[0];
        dailyData[key] = { revenue: 0, orders: 0 };
      }

      // Fill in actual data
      orders.forEach((order) => {
        const key = order.createdAt.toISOString().split("T")[0];
        if (dailyData[key]) {
          dailyData[key].revenue += Number(order.total);
          dailyData[key].orders += 1;
        }
      });

      return Object.entries(dailyData).map(([date, data]) => ({
        date,
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.orders,
      }));
    }),

  // Summary statistics
  getSummaryStats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // This month's stats
    const thisMonthOrders = await ctx.db.order.findMany({
      where: {
        createdAt: { gte: thisMonthStart },
        status: { not: "CANCELLED" },
      },
      select: { total: true },
    });

    // Last month's stats
    const lastMonthOrders = await ctx.db.order.findMany({
      where: {
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        status: { not: "CANCELLED" },
      },
      select: { total: true },
    });

    // This week's stats
    const thisWeekOrders = await ctx.db.order.findMany({
      where: {
        createdAt: { gte: thisWeekStart },
        status: { not: "CANCELLED" },
      },
      select: { total: true },
    });

    // All time stats
    const allTimeOrders = await ctx.db.order.count({
      where: { status: { not: "CANCELLED" } },
    });

    const allTimeRevenue = await ctx.db.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { total: true },
    });

    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + Number(o.total), 0);

    const avgOrderValue = thisMonthOrders.length > 0
      ? thisMonthRevenue / thisMonthOrders.length
      : 0;

    const revenueChange = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    return {
      thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
      thisMonthOrders: thisMonthOrders.length,
      thisWeekRevenue: Math.round(thisWeekRevenue * 100) / 100,
      thisWeekOrders: thisWeekOrders.length,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      revenueChange,
      allTimeOrders,
      allTimeRevenue: Number(allTimeRevenue._sum.total) || 0,
    };
  }),

  // Sales by category
  getSalesByCategory: adminProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const days = input?.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const orderItems = await ctx.db.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: startDate },
            status: { not: "CANCELLED" },
          },
        },
        include: {
          product: {
            include: {
              category: {
                include: { translations: { where: { locale: "nl" } } },
              },
            },
          },
        },
      });

      const categoryStats: Record<string, { name: string; revenue: number; quantity: number }> = {};

      orderItems.forEach((item) => {
        const categoryId = item.product.categoryId;
        const categoryName = item.product.category.translations[0]?.name || item.product.category.slug;

        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = { name: categoryName, revenue: 0, quantity: 0 };
        }

        categoryStats[categoryId].revenue += Number(item.totalPrice);
        categoryStats[categoryId].quantity += item.quantity;
      });

      return Object.values(categoryStats)
        .sort((a, b) => b.revenue - a.revenue)
        .map((stat) => ({
          ...stat,
          revenue: Math.round(stat.revenue * 100) / 100,
        }));
    }),

  // Top products
  getTopProducts: adminProcedure
    .input(z.object({ days: z.number().default(30), limit: z.number().default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const days = input?.days || 30;
      const limit = input?.limit || 10;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const orderItems = await ctx.db.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: startDate },
            status: { not: "CANCELLED" },
          },
        },
        include: {
          product: {
            include: { translations: { where: { locale: "nl" } } },
          },
        },
      });

      const productStats: Record<string, { name: string; revenue: number; quantity: number }> = {};

      orderItems.forEach((item) => {
        const productId = item.productId;
        const productName = item.product.translations[0]?.name || item.product.slug;

        if (!productStats[productId]) {
          productStats[productId] = { name: productName, revenue: 0, quantity: 0 };
        }

        productStats[productId].revenue += Number(item.totalPrice);
        productStats[productId].quantity += item.quantity;
      });

      return Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit)
        .map((stat) => ({
          ...stat,
          revenue: Math.round(stat.revenue * 100) / 100,
        }));
    }),

  // Peak hours analysis
  getPeakHours: adminProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const days = input?.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const orders = await ctx.db.order.findMany({
        where: {
          createdAt: { gte: startDate },
          status: { not: "CANCELLED" },
        },
        select: { createdAt: true },
      });

      // Group by hour
      const hourlyData: Record<number, number> = {};
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = 0;
      }

      orders.forEach((order) => {
        const hour = order.createdAt.getHours();
        hourlyData[hour]++;
      });

      return Object.entries(hourlyData).map(([hour, count]) => ({
        hour: parseInt(hour),
        label: `${hour.padStart(2, "0")}:00`,
        orders: count,
      }));
    }),

  // Loyalty program stats
  getLoyaltyStats: adminProcedure.query(async ({ ctx }) => {
    // Tier distribution
    const tierCounts = await ctx.db.user.groupBy({
      by: ["loyaltyTier"],
      _count: true,
    });

    // Total points issued vs redeemed
    const pointsStats = await ctx.db.loyaltyTransaction.groupBy({
      by: ["type"],
      _sum: { points: true },
    });

    const pointsEarned = pointsStats.find((s) => s.type === "EARN")?._sum.points || 0;
    const pointsRedeemed = Math.abs(pointsStats.find((s) => s.type === "REDEEM")?._sum.points || 0);
    const bonusPoints = pointsStats.find((s) => s.type === "BONUS")?._sum.points || 0;

    // Top loyalty members
    const topMembers = await ctx.db.user.findMany({
      where: { loyaltyPoints: { gt: 0 } },
      select: {
        id: true,
        name: true,
        email: true,
        loyaltyPoints: true,
        loyaltyTier: true,
      },
      orderBy: { loyaltyPoints: "desc" },
      take: 5,
    });

    // Recent redemptions
    const recentRedemptions = await ctx.db.loyaltyTransaction.findMany({
      where: { type: "REDEEM" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return {
      tierDistribution: tierCounts.map((t) => ({
        tier: t.loyaltyTier,
        count: t._count,
      })),
      pointsEarned,
      pointsRedeemed,
      bonusPoints,
      totalPointsInCirculation: pointsEarned + bonusPoints - pointsRedeemed,
      topMembers: topMembers.map((m) => ({
        name: m.name || m.email.split("@")[0],
        points: m.loyaltyPoints,
        tier: m.loyaltyTier,
      })),
      recentRedemptions: recentRedemptions.map((r) => ({
        user: r.user.name || r.user.email.split("@")[0],
        points: Math.abs(r.points),
        description: r.description,
        date: r.createdAt,
      })),
    };
  }),

  // Customer stats
  getCustomerStats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalCustomers = await ctx.db.user.count({
      where: { role: "USER" },
    });

    const newThisMonth = await ctx.db.user.count({
      where: {
        role: "USER",
        createdAt: { gte: thisMonthStart },
      },
    });

    const newLastMonth = await ctx.db.user.count({
      where: {
        role: "USER",
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    });

    // Customers with orders
    const customersWithOrders = await ctx.db.user.count({
      where: {
        role: "USER",
        orders: { some: {} },
      },
    });

    // Repeat customers (more than 1 order)
    const usersWithOrderCounts = await ctx.db.user.findMany({
      where: { role: "USER" },
      select: {
        _count: { select: { orders: true } },
      },
    });

    const repeatCustomers = usersWithOrderCounts.filter(
      (u) => u._count.orders > 1
    ).length;

    const growthRate = newLastMonth > 0
      ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
      : 0;

    return {
      totalCustomers,
      newThisMonth,
      newLastMonth,
      growthRate,
      customersWithOrders,
      repeatCustomers,
      conversionRate: totalCustomers > 0
        ? Math.round((customersWithOrders / totalCustomers) * 100)
        : 0,
      retentionRate: customersWithOrders > 0
        ? Math.round((repeatCustomers / customersWithOrders) * 100)
        : 0,
    };
  }),

  // Order status distribution
  getOrderStatusDistribution: adminProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const days = input?.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const statusCounts = await ctx.db.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: startDate } },
        _count: true,
      });

      return statusCounts.map((s) => ({
        status: s.status,
        count: s._count,
      }));
    }),
});
