"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import {
  ShoppingBag,
  Euro,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Package,
  BarChart3,
  Settings,
  ChevronRight,
  Coffee,
  Cherry,
  Shield,
  FolderOpen,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusLabels = {
  PENDING: "In afwachting",
  PAID: "Betaald",
  PREPARING: "In bereiding",
  READY: "Klaar",
  COMPLETED: "Afgehaald",
  CANCELLED: "Geannuleerd",
};

export default function AdminDashboardPage() {
  const t = useTranslations("admin.dashboard");
  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch real data from database
  const { data: todayStats, isLoading: statsLoading } = api.orders.getTodayStats.useQuery(
    undefined,
    { enabled: status === "authenticated" && (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") }
  );

  const { data: recentOrders, isLoading: ordersLoading } = api.orders.getRecentOrders.useQuery(
    { limit: 3 },
    { enabled: status === "authenticated" && (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") }
  );

  const { data: popularProducts, isLoading: productsLoading } = api.orders.getPopularProducts.useQuery(
    undefined,
    { enabled: status === "authenticated" && (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") }
  );

  const { data: customerStats, isLoading: customersLoading } = api.users.getCustomerCount.useQuery(
    undefined,
    { enabled: status === "authenticated" && (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") }
  );

  const isLoading = statsLoading || ordersLoading || productsLoading || customersLoading;

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

  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isAdmin = userRole === "ADMIN" || isSuperAdmin;

  if (status === "unauthenticated" || !isAdmin) {
    router.push("/");
    return null;
  }

  // Calculate percentage changes
  const orderChange = todayStats?.yesterdayCount
    ? Math.round(((todayStats.count - todayStats.yesterdayCount) / todayStats.yesterdayCount) * 100)
    : 0;

  const revenueChange = todayStats?.yesterdayRevenue
    ? Math.round(((todayStats.revenue - todayStats.yesterdayRevenue) / todayStats.yesterdayRevenue) * 100)
    : 0;

  return (
    <div className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="heading-1">{t("title")}</h1>
            <p className="mt-2 text-muted-foreground">
              Welkom terug! Hier is een overzicht van vandaag.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/orders">
              <Button variant="tea">
                <Package className="mr-2 h-4 w-4" />
                Bestellingen
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("todayOrders")}
                  </p>
                  <p className="text-3xl font-bold">
                    {statsLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : todayStats?.count ?? 0}
                  </p>
                </div>
                <div className="rounded-full bg-tea-100 p-3">
                  <ShoppingBag className="h-6 w-6 text-tea-600" />
                </div>
              </div>
              <div className={`mt-2 flex items-center text-sm ${orderChange >= 0 ? "text-matcha-600" : "text-red-600"}`}>
                {orderChange >= 0 ? (
                  <TrendingUp className="mr-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="mr-1 h-4 w-4" />
                )}
                {orderChange >= 0 ? "+" : ""}{orderChange}% t.o.v. gisteren
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("todayRevenue")}
                  </p>
                  <p className="text-3xl font-bold">
                    {statsLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : `€${(todayStats?.revenue ?? 0).toFixed(2)}`}
                  </p>
                </div>
                <div className="rounded-full bg-matcha-100 p-3">
                  <Euro className="h-6 w-6 text-matcha-600" />
                </div>
              </div>
              <div className={`mt-2 flex items-center text-sm ${revenueChange >= 0 ? "text-matcha-600" : "text-red-600"}`}>
                {revenueChange >= 0 ? (
                  <TrendingUp className="mr-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="mr-1 h-4 w-4" />
                )}
                {revenueChange >= 0 ? "+" : ""}{revenueChange}% t.o.v. gisteren
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("pendingOrders")}
                  </p>
                  <p className="text-3xl font-bold">
                    {statsLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : todayStats?.pending ?? 0}
                  </p>
                </div>
                <div className="rounded-full bg-yellow-100 p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Actie vereist
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("totalCustomers")}
                  </p>
                  <p className="text-3xl font-bold">
                    {customersLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : customerStats?.total ?? 0}
                  </p>
                </div>
                <div className="rounded-full bg-taro-100 p-3">
                  <Users className="h-6 w-6 text-taro-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-matcha-600">
                <TrendingUp className="mr-1 h-4 w-4" />
                +{customerStats?.newThisWeek ?? 0} deze week
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recente Bestellingen</CardTitle>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm">
                  Alles bekijken
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-tea-600" />
                </div>
              ) : recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tea-100">
                          <Coffee className="h-5 w-5 text-tea-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{order.id}</p>
                            <Badge
                              className={
                                statusColors[
                                  order.status as keyof typeof statusColors
                                ]
                              }
                            >
                              {
                                statusLabels[
                                  order.status as keyof typeof statusLabels
                                ]
                              }
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.customer} • {order.items.slice(0, 2).join(", ")}{order.items.length > 2 ? ` +${order.items.length - 2}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">€{order.total.toFixed(2)}</p>
                        {order.time && (
                          <p className="text-sm text-muted-foreground">
                            Afhalen: {order.time}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  Nog geen bestellingen vandaag
                </p>
              )}
            </CardContent>
          </Card>

          {/* Popular Products */}
          <Card>
            <CardHeader>
              <CardTitle>Populaire Producten</CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-tea-600" />
                </div>
              ) : popularProducts && popularProducts.length > 0 ? (
                <div className="space-y-4">
                  {popularProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {product.orders} bestellingen
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  Nog geen data beschikbaar
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/products">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-tea-100 p-3">
                  <Coffee className="h-6 w-6 text-tea-600" />
                </div>
                <div>
                  <p className="font-medium">Producten Beheren</p>
                  <p className="text-sm text-muted-foreground">
                    Voeg toe, bewerk of verwijder
                  </p>
                </div>
                <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          {isSuperAdmin && (
            <Link href="/admin/categories">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-matcha-100 p-3">
                    <FolderOpen className="h-6 w-6 text-matcha-600" />
                  </div>
                  <div>
                    <p className="font-medium">Categorieën</p>
                    <p className="text-sm text-muted-foreground">
                      Beheer productcategorieën
                    </p>
                  </div>
                  <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}

          <Link href="/admin/toppings">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-taro-100 p-3">
                  <Cherry className="h-6 w-6 text-taro-600" />
                </div>
                <div>
                  <p className="font-medium">Toppings Beheren</p>
                  <p className="text-sm text-muted-foreground">
                    Tapioca, boba en meer
                  </p>
                </div>
                <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/analytics">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-matcha-100 p-3">
                  <BarChart3 className="h-6 w-6 text-matcha-600" />
                </div>
                <div>
                  <p className="font-medium">Analytics</p>
                  <p className="text-sm text-muted-foreground">
                    Bekijk statistieken en rapporten
                  </p>
                </div>
                <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/settings">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-cream-100 p-3">
                  <Settings className="h-6 w-6 text-cream-600" />
                </div>
                <div>
                  <p className="font-medium">Instellingen</p>
                  <p className="text-sm text-muted-foreground">
                    Winkel en loyaliteit
                  </p>
                </div>
                <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Security Section */}
        <div className="mt-4">
          <Link href="/admin/security">
            <Card className="cursor-pointer border-tea-200 transition-colors hover:bg-tea-50">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-tea-100 p-3">
                  <Shield className="h-6 w-6 text-tea-600" />
                </div>
                <div>
                  <p className="font-medium">Beveiliging</p>
                  <p className="text-sm text-muted-foreground">
                    Twee-factor authenticatie en account beveiliging
                  </p>
                </div>
                <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
