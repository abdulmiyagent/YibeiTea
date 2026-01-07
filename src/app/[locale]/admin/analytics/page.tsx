"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Euro,
  ShoppingBag,
  Users,
  Clock,
  Crown,
  Gift,
  ArrowLeft,
  Loader2,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  PENDING: "In afwachting",
  PAID: "Betaald",
  PREPARING: "In bereiding",
  READY: "Klaar",
  COMPLETED: "Afgehaald",
  CANCELLED: "Geannuleerd",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const tierColors: Record<string, string> = {
  BRONZE: "bg-amber-100 text-amber-800",
  SILVER: "bg-gray-200 text-gray-800",
  GOLD: "bg-yellow-100 text-yellow-800",
};

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState(30);

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  // Fetch all analytics data
  const { data: summaryStats, isLoading: summaryLoading } = api.analytics.getSummaryStats.useQuery(
    undefined,
    { enabled: status === "authenticated" && isAdmin }
  );

  const { data: revenueData, isLoading: revenueLoading } = api.analytics.getRevenueOverTime.useQuery(
    { days: timeRange },
    { enabled: status === "authenticated" && isAdmin }
  );

  const { data: categoryData, isLoading: categoryLoading } = api.analytics.getSalesByCategory.useQuery(
    { days: timeRange },
    { enabled: status === "authenticated" && isAdmin }
  );

  const { data: topProducts, isLoading: productsLoading } = api.analytics.getTopProducts.useQuery(
    { days: timeRange, limit: 10 },
    { enabled: status === "authenticated" && isAdmin }
  );

  const { data: bottomProducts, isLoading: bottomProductsLoading } = api.analytics.getBottomProducts.useQuery(
    { days: timeRange, limit: 10 },
    { enabled: status === "authenticated" && isAdmin }
  );

  const { data: peakHours, isLoading: peakLoading } = api.analytics.getPeakHours.useQuery(
    { days: timeRange },
    { enabled: status === "authenticated" && isAdmin }
  );

  const { data: loyaltyStats, isLoading: loyaltyLoading } = api.analytics.getLoyaltyStats.useQuery(
    undefined,
    { enabled: status === "authenticated" && isAdmin }
  );

  const { data: customerStats, isLoading: customerLoading } = api.analytics.getCustomerStats.useQuery(
    undefined,
    { enabled: status === "authenticated" && isAdmin }
  );

  const { data: statusDistribution, isLoading: statusLoading } = api.analytics.getOrderStatusDistribution.useQuery(
    { days: timeRange },
    { enabled: status === "authenticated" && isAdmin }
  );

  const isLoading = summaryLoading || revenueLoading || categoryLoading || productsLoading ||
                    bottomProductsLoading || peakLoading || loyaltyLoading || customerLoading || statusLoading;

  if (status === "loading") {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !isAdmin) {
    router.push("/");
    return null;
  }

  // Calculate max revenue for chart scaling
  const maxRevenue = revenueData ? Math.max(...revenueData.map((d) => d.revenue), 1) : 1;
  const maxOrders = revenueData ? Math.max(...revenueData.map((d) => d.orders), 1) : 1;
  const maxPeakOrders = peakHours ? Math.max(...peakHours.map((h) => h.orders), 1) : 1;
  const maxCategoryRevenue = categoryData ? Math.max(...categoryData.map((c) => c.revenue), 1) : 1;

  return (
    <div className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-1 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-tea-600" />
                Analytics
              </h1>
              <p className="mt-2 text-muted-foreground">
                Uitgebreide statistieken en inzichten
              </p>
            </div>
            <div className="flex gap-2">
              {[7, 30, 90].map((days) => (
                <Button
                  key={days}
                  variant={timeRange === days ? "tea" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(days)}
                >
                  {days}d
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Omzet deze maand</p>
                  <p className="text-3xl font-bold">
                    {summaryLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      `€${(summaryStats?.thisMonthRevenue ?? 0).toFixed(2)}`
                    )}
                  </p>
                </div>
                <div className="rounded-full bg-matcha-100 p-3">
                  <Euro className="h-6 w-6 text-matcha-600" />
                </div>
              </div>
              {summaryStats && (
                <div className={`mt-2 flex items-center text-sm ${summaryStats.revenueChange >= 0 ? "text-matcha-600" : "text-red-600"}`}>
                  {summaryStats.revenueChange >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  {summaryStats.revenueChange >= 0 ? "+" : ""}{summaryStats.revenueChange}% t.o.v. vorige maand
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bestellingen deze maand</p>
                  <p className="text-3xl font-bold">
                    {summaryLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      summaryStats?.thisMonthOrders ?? 0
                    )}
                  </p>
                </div>
                <div className="rounded-full bg-tea-100 p-3">
                  <ShoppingBag className="h-6 w-6 text-tea-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {summaryStats?.thisWeekOrders ?? 0} deze week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gem. bestelwaarde</p>
                  <p className="text-3xl font-bold">
                    {summaryLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      `€${(summaryStats?.avgOrderValue ?? 0).toFixed(2)}`
                    )}
                  </p>
                </div>
                <div className="rounded-full bg-taro-100 p-3">
                  <TrendingUp className="h-6 w-6 text-taro-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Totaal: {summaryStats?.allTimeOrders ?? 0} bestellingen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Totale klanten</p>
                  <p className="text-3xl font-bold">
                    {customerLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      customerStats?.totalCustomers ?? 0
                    )}
                  </p>
                </div>
                <div className="rounded-full bg-honey-100 p-3">
                  <Users className="h-6 w-6 text-honey-600" />
                </div>
              </div>
              {customerStats && (
                <div className={`mt-2 flex items-center text-sm ${customerStats.growthRate >= 0 ? "text-matcha-600" : "text-red-600"}`}>
                  {customerStats.growthRate >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  +{customerStats.newThisMonth} deze maand
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Omzet & Bestellingen ({timeRange} dagen)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
              </div>
            ) : revenueData && revenueData.length > 0 ? (
              <div className="h-64">
                <div className="flex h-full items-end gap-1">
                  {revenueData.map((day, index) => (
                    <div
                      key={day.date}
                      className="group relative flex-1"
                      title={`${day.date}: €${day.revenue.toFixed(2)} (${day.orders} bestellingen)`}
                    >
                      {/* Revenue bar */}
                      <div
                        className="w-full rounded-t bg-tea-500 transition-all hover:bg-tea-600"
                        style={{
                          height: `${(day.revenue / maxRevenue) * 100}%`,
                          minHeight: day.revenue > 0 ? "4px" : "0",
                        }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                        {day.date.split("-").slice(1).join("/")}
                        <br />
                        €{day.revenue.toFixed(2)}
                        <br />
                        {day.orders} bestellingen
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{revenueData[0]?.date.split("-").slice(1).join("/")}</span>
                  <span>{revenueData[revenueData.length - 1]?.date.split("-").slice(1).join("/")}</span>
                </div>
              </div>
            ) : (
              <p className="py-12 text-center text-muted-foreground">
                Geen data beschikbaar voor deze periode
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-matcha-600" />
                Top 10 Producten
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-tea-600" />
                </div>
              ) : topProducts && topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-matcha-100 text-sm font-medium text-matcha-700">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity}x verkocht
                        </p>
                      </div>
                      <p className="font-medium text-matcha-600">€{product.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-muted-foreground">
                  Geen productdata beschikbaar
                </p>
              )}
            </CardContent>
          </Card>

          {/* Bottom Products (Least Sold) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Minst Verkochte Producten
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bottomProductsLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-tea-600" />
                </div>
              ) : bottomProducts && bottomProducts.length > 0 ? (
                <div className="space-y-3">
                  {bottomProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-sm font-medium text-red-700">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity}x verkocht
                        </p>
                      </div>
                      <p className="font-medium text-red-600">€{product.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-muted-foreground">
                  Geen productdata beschikbaar
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Sales by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Verkoop per Categorie</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-tea-600" />
                </div>
              ) : categoryData && categoryData.length > 0 ? (
                <div className="space-y-4">
                  {categoryData.map((category) => (
                    <div key={category.name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-muted-foreground">
                          €{category.revenue.toFixed(2)} ({category.quantity}x)
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-tea-500"
                          style={{
                            width: `${(category.revenue / maxCategoryRevenue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-muted-foreground">
                  Geen categoriedata beschikbaar
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Piekuren
              </CardTitle>
            </CardHeader>
            <CardContent>
              {peakLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-tea-600" />
                </div>
              ) : peakHours && peakHours.length > 0 ? (
                <div className="h-48">
                  <div className="flex h-full items-end gap-1">
                    {peakHours
                      .filter((h) => h.hour >= 8 && h.hour <= 22)
                      .map((hour) => (
                        <div
                          key={hour.hour}
                          className="group relative flex-1"
                          title={`${hour.label}: ${hour.orders} bestellingen`}
                        >
                          <div
                            className="w-full rounded-t bg-matcha-500 transition-all hover:bg-matcha-600"
                            style={{
                              height: `${(hour.orders / maxPeakOrders) * 100}%`,
                              minHeight: hour.orders > 0 ? "4px" : "0",
                            }}
                          />
                          <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                            {hour.label}: {hour.orders}
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>08:00</span>
                    <span>15:00</span>
                    <span>22:00</span>
                  </div>
                </div>
              ) : (
                <p className="py-12 text-center text-muted-foreground">
                  Geen uurdata beschikbaar
                </p>
              )}
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Bestelstatus Verdeling</CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-tea-600" />
                </div>
              ) : statusDistribution && statusDistribution.length > 0 ? (
                <div className="space-y-3">
                  {statusDistribution.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <Badge className={statusColors[status.status]}>
                        {statusLabels[status.status]}
                      </Badge>
                      <span className="font-medium">{status.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-muted-foreground">
                  Geen statusdata beschikbaar
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Loyalty Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Loyaliteitsprogramma
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loyaltyLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-tea-600" />
              </div>
            ) : loyaltyStats ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Points Overview */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Punten Overzicht</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Totaal uitgegeven</span>
                      <span className="font-medium text-matcha-600">+{loyaltyStats.pointsEarned.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingewisseld</span>
                      <span className="font-medium text-red-600">-{loyaltyStats.pointsRedeemed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bonuspunten</span>
                      <span className="font-medium text-taro-600">+{loyaltyStats.bonusPoints.toLocaleString()}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between">
                      <span className="font-medium">In omloop</span>
                      <span className="font-bold text-tea-600">{loyaltyStats.totalPointsInCirculation.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Tier Distribution */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Niveau Verdeling</h3>
                  <div className="space-y-3">
                    {loyaltyStats.tierDistribution.map((tier) => (
                      <div key={tier.tier} className="flex items-center justify-between">
                        <Badge className={tierColors[tier.tier]}>{tier.tier}</Badge>
                        <span className="font-medium">{tier.count} leden</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Members */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Top Leden</h3>
                  <div className="space-y-2">
                    {loyaltyStats.topMembers.map((member, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="truncate">{member.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {member.points.toLocaleString()} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Redemptions */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Recente Inwisselingen</h3>
                  <div className="space-y-2">
                    {loyaltyStats.recentRedemptions.length > 0 ? (
                      loyaltyStats.recentRedemptions.map((redemption, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium">{redemption.user}</p>
                          <p className="text-xs text-muted-foreground">
                            {redemption.description} (-{redemption.points} pts)
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nog geen inwisselingen</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-12 text-center text-muted-foreground">
                Geen loyaliteitsdata beschikbaar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Customer Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Klantstatistieken
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customerLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-tea-600" />
              </div>
            ) : customerStats ? (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-tea-600">{customerStats.totalCustomers}</p>
                  <p className="text-sm text-muted-foreground">Totaal accounts</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-matcha-600">{customerStats.customersWithOrders}</p>
                  <p className="text-sm text-muted-foreground">Met bestellingen</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-taro-600">{customerStats.repeatCustomers}</p>
                  <p className="text-sm text-muted-foreground">Terugkerende klanten</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-honey-600">{customerStats.retentionRate}%</p>
                  <p className="text-sm text-muted-foreground">Retentiepercentage</p>
                </div>
              </div>
            ) : (
              <p className="py-12 text-center text-muted-foreground">
                Geen klantdata beschikbaar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
