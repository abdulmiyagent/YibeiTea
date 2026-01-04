"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Euro,
  Clock,
  Users,
  TrendingUp,
  Package,
  BarChart3,
  Settings,
  ChevronRight,
  Coffee,
} from "lucide-react";
import Link from "next/link";

// Sample data - would come from database
const stats = {
  todayOrders: 24,
  todayRevenue: 132.5,
  pendingOrders: 3,
  totalCustomers: 156,
};

const recentOrders = [
  {
    id: "YBT-XYZ789",
    customer: "Emma V.",
    items: ["Classic Taro", "Brown Sugar Boba"],
    total: 11.0,
    status: "PREPARING",
    time: "14:30",
  },
  {
    id: "YBT-ABC123",
    customer: "Thomas D.",
    items: ["Matcha Latte"],
    total: 5.5,
    status: "READY",
    time: "14:15",
  },
  {
    id: "YBT-DEF456",
    customer: "Lisa M.",
    items: ["Peach Garden Mojito", "Green Apple Ice Tea"],
    total: 11.5,
    status: "PENDING",
    time: "14:45",
  },
];

const popularProducts = [
  { name: "Classic Taro", orders: 45 },
  { name: "Brown Sugar Boba", orders: 38 },
  { name: "Matcha Latte", orders: 32 },
  { name: "Strawberry Ice Tea", orders: 28 },
];

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PREPARING: "bg-blue-100 text-blue-800",
  READY: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

const statusLabels = {
  PENDING: "In afwachting",
  PREPARING: "In bereiding",
  READY: "Klaar",
  COMPLETED: "Afgehaald",
};

export default function AdminDashboardPage() {
  const t = useTranslations("admin.dashboard");
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    router.push("/");
    return null;
  }

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
                  <p className="text-3xl font-bold">{stats.todayOrders}</p>
                </div>
                <div className="rounded-full bg-tea-100 p-3">
                  <ShoppingBag className="h-6 w-6 text-tea-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-matcha-600">
                <TrendingUp className="mr-1 h-4 w-4" />
                +12% t.o.v. gisteren
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
                    €{stats.todayRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-full bg-matcha-100 p-3">
                  <Euro className="h-6 w-6 text-matcha-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-matcha-600">
                <TrendingUp className="mr-1 h-4 w-4" />
                +8% t.o.v. gisteren
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
                  <p className="text-3xl font-bold">{stats.pendingOrders}</p>
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
                  <p className="text-3xl font-bold">{stats.totalCustomers}</p>
                </div>
                <div className="rounded-full bg-taro-100 p-3">
                  <Users className="h-6 w-6 text-taro-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-matcha-600">
                <TrendingUp className="mr-1 h-4 w-4" />
                +5 deze week
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
                          {order.customer} • {order.items.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€{order.total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        Afhalen: {order.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Products */}
          <Card>
            <CardHeader>
              <CardTitle>Populaire Producten</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
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
                <div className="rounded-full bg-taro-100 p-3">
                  <Settings className="h-6 w-6 text-taro-600" />
                </div>
                <div>
                  <p className="font-medium">Instellingen</p>
                  <p className="text-sm text-muted-foreground">
                    Winkel en loyaliteit instellingen
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
