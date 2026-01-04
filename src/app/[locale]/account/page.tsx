"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Heart,
  Gift,
  Settings,
  Crown,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

export default function AccountPage() {
  const t = useTranslations("account");
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const loyaltyPoints = session?.user?.loyaltyPoints || 0;
  const loyaltyTier = session?.user?.loyaltyTier || "BRONZE";

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
    BRONZE: 500 - loyaltyPoints,
    SILVER: 1000 - loyaltyPoints,
    GOLD: 0,
  };

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
            <div className="space-y-4">
              {/* Sample orders - would come from database */}
              {[
                {
                  id: "YBT-ABC123",
                  date: "2024-01-15",
                  status: "COMPLETED",
                  total: 16.5,
                  items: ["Classic Taro", "Matcha Latte", "Brown Sugar Boba"],
                },
                {
                  id: "YBT-DEF456",
                  date: "2024-01-10",
                  status: "COMPLETED",
                  total: 11.0,
                  items: ["Strawberry Iced Tea", "Peach Garden Mojito"],
                },
              ].map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{order.total.toFixed(2)}</p>
                    <Badge variant="success">Afgehaald</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
