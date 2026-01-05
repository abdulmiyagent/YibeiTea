"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc";
import {
  Package,
  Heart,
  Gift,
  Settings,
  Crown,
  ChevronRight,
  Loader2,
  Coffee,
} from "lucide-react";

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

export default function AccountPage() {
  const t = useTranslations("account");
  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch real loyalty data
  const { data: loyaltyInfo, isLoading: loyaltyLoading } = api.users.getLoyaltyInfo.useQuery(
    undefined,
    { enabled: status === "authenticated" }
  );

  // Fetch real orders
  const { data: orders, isLoading: ordersLoading } = api.orders.getMyOrders.useQuery(
    undefined,
    { enabled: status === "authenticated" }
  );

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

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const loyaltyPoints = loyaltyInfo?.loyaltyPoints ?? session?.user?.loyaltyPoints ?? 0;
  const loyaltyTier = loyaltyInfo?.loyaltyTier ?? session?.user?.loyaltyTier ?? "BRONZE";

  const tierColors = {
    BRONZE: "bg-amber-100 text-amber-800",
    SILVER: "bg-gray-100 text-gray-800",
    GOLD: "bg-yellow-100 text-yellow-800",
  };

  const tierLabels = {
    BRONZE: "Bronze",
    SILVER: "Silver",
    GOLD: "Gold",
  };

  const pointsToNextTier = {
    BRONZE: Math.max(0, 500 - loyaltyPoints),
    SILVER: Math.max(0, 1000 - loyaltyPoints),
    GOLD: 0,
  };

  const recentOrders = orders?.slice(0, 3) ?? [];

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-1">
            {t("welcome", { name: session?.user?.name?.split(" ")[0] || "Gast" })}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Beheer je account, bestellingen en beloningen
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Loyalty Card */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-tea-600" />
                {t("loyalty.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loyaltyLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-tea-600" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-tea-600">
                        {loyaltyPoints}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("loyalty.points")}
                      </p>
                    </div>
                    <Badge
                      className={tierColors[loyaltyTier as keyof typeof tierColors]}
                    >
                      {tierLabels[loyaltyTier as keyof typeof tierLabels]}
                    </Badge>
                  </div>

                  {loyaltyTier !== "GOLD" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Volgende niveau
                        </span>
                        <span className="font-medium">
                          {pointsToNextTier[loyaltyTier as keyof typeof pointsToNextTier]}{" "}
                          punten
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-tea-500 transition-all"
                          style={{
                            width: `${Math.min(
                              (loyaltyPoints /
                                (loyaltyTier === "BRONZE" ? 500 : 1000)) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {loyaltyTier === "GOLD" && (
                    <p className="text-sm text-matcha-600 font-medium">
                      Je hebt het hoogste niveau bereikt!
                    </p>
                  )}
                </>
              )}

              <Link href="/account/rewards">
                <Button variant="outline" className="w-full">
                  <Gift className="mr-2 h-4 w-4" />
                  {t("loyalty.rewards")}
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-tea-600" />
                {t("orders.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Bekijk je recente bestellingen en bestelgeschiedenis
              </p>
              <Link href="/account/orders">
                <Button variant="tea" className="w-full">
                  Bestellingen Bekijken
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-tea-600" />
                {t("favorites.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Je favoriete drankjes voor snelle herbestellingen
              </p>
              <Link href="/account/favorites">
                <Button variant="outline" className="w-full">
                  Favorieten Bekijken
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders Preview */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recente Bestellingen</CardTitle>
            <Link href="/account/orders">
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
            ) : recentOrders.length > 0 ? (
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
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items
                            .slice(0, 2)
                            .map((item) => item.product?.slug || "Product")
                            .join(", ")}
                          {order.items.length > 2 && ` +${order.items.length - 2}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("nl-BE")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€{Number(order.total).toFixed(2)}</p>
                      <Badge
                        className={
                          statusColors[order.status as keyof typeof statusColors]
                        }
                      >
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </Badge>
                      {order.pointsEarned > 0 && (
                        <p className="text-xs text-matcha-600 mt-1">
                          +{order.pointsEarned} punten
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                Je hebt nog geen bestellingen geplaatst
              </p>
            )}
          </CardContent>
        </Card>

        {/* Loyalty Transactions */}
        {loyaltyInfo?.transactions && loyaltyInfo.transactions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-tea-600" />
                Punten Geschiedenis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loyaltyInfo.transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString("nl-BE")}
                      </p>
                    </div>
                    <span
                      className={`font-medium ${
                        tx.points > 0 ? "text-matcha-600" : "text-red-600"
                      }`}
                    >
                      {tx.points > 0 ? "+" : ""}
                      {tx.points} punten
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Link */}
        <div className="mt-6">
          <Link href="/account/settings">
            <Button variant="outline" className="w-full md:w-auto">
              <Settings className="mr-2 h-4 w-4" />
              {t("settings.title")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
