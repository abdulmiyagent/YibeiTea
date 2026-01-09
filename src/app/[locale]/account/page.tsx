"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc";
import Image from "next/image";
import {
  Package,
  Heart,
  Gift,
  Settings,
  Crown,
  ChevronRight,
  Loader2,
  Coffee,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

const statusColors = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-sky-50 text-sky-700 border-sky-200",
  PREPARING: "bg-orange-50 text-orange-700 border-orange-200",
  READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-stone-50 text-stone-600 border-stone-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
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

  const { data: loyaltyInfo, isLoading: loyaltyLoading } =
    api.users.getLoyaltyInfo.useQuery(undefined, {
      enabled: status === "authenticated",
    });

  const { data: orders, isLoading: ordersLoading } =
    api.orders.getMyOrders.useQuery(undefined, {
      enabled: status === "authenticated",
    });

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
        <div className="container-custom flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-bordeaux-100 border-t-bordeaux-600" />
              <Coffee className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-bordeaux-600" />
            </div>
            <p className="font-serif text-lg text-bordeaux-700">Even geduld...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const loyaltyPoints =
    loyaltyInfo?.loyaltyPoints ?? session?.user?.loyaltyPoints ?? 0;
  const loyaltyTier =
    loyaltyInfo?.loyaltyTier ?? session?.user?.loyaltyTier ?? "BRONZE";

  const tierConfig = {
    BRONZE: {
      gradient: "from-amber-600 via-amber-500 to-yellow-500",
      cardBg: "from-amber-800 via-amber-700 to-amber-900",
      accent: "text-amber-600",
      badge: "bg-amber-100 text-amber-800",
      icon: Crown,
      glow: "shadow-[0_8px_40px_-12px_rgba(217,119,6,0.3)]",
      label: "Bronze Member",
    },
    SILVER: {
      gradient: "from-slate-400 via-slate-300 to-slate-400",
      cardBg: "from-slate-600 via-slate-500 to-slate-700",
      accent: "text-slate-600",
      badge: "bg-slate-100 text-slate-800",
      icon: Star,
      glow: "shadow-[0_8px_40px_-12px_rgba(100,116,139,0.35)]",
      label: "Silver Member",
    },
    GOLD: {
      gradient: "from-yellow-400 via-amber-300 to-yellow-500",
      cardBg: "from-yellow-600 via-amber-500 to-yellow-700",
      accent: "text-yellow-600",
      badge: "bg-yellow-100 text-yellow-800",
      icon: Sparkles,
      glow: "shadow-[0_8px_40px_-12px_rgba(234,179,8,0.35)]",
      label: "Gold Member",
    },
  };

  const currentTierConfig = tierConfig[loyaltyTier as keyof typeof tierConfig];
  const TierIcon = currentTierConfig.icon;

  const tierLabels = {
    BRONZE: "Bronze",
    SILVER: "Silver",
    GOLD: "Gold",
  };

  const pointsToNextTier = {
    BRONZE: { target: 500, next: "Silver" },
    SILVER: { target: 1000, next: "Gold" },
    GOLD: { target: 0, next: null },
  };

  const tierInfo = pointsToNextTier[loyaltyTier as keyof typeof pointsToNextTier];
  const progressPercent = tierInfo.target
    ? Math.min((loyaltyPoints / tierInfo.target) * 100, 100)
    : 100;

  const recentOrders = orders?.slice(0, 4) ?? [];
  const firstName = session?.user?.name?.split(" ")[0] || "Gast";

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-cream-100/50 to-cream-50">
      {/* Subtle Background Pattern */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-30">
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-radial from-bordeaux-200/40 to-transparent" />
        <div className="absolute -bottom-48 -left-48 h-[600px] w-[600px] rounded-full bg-gradient-radial from-tea-200/30 to-transparent" />
      </div>

      <div className="relative section-padding-sm">
        <div className="container-custom">
          {/* Welcome Hero */}
          <div
            className="mb-10 opacity-0 animate-fade-up"
            style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bordeaux-800 via-bordeaux-900 to-bordeaux-950 p-8 md:p-10">
              {/* Decorative Elements */}
              <div className="absolute inset-0 opacity-[0.07]">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L30 25 L25 15 Z' fill='%23ffffff' fill-opacity='0.4'/%3E%3Ccircle cx='30' cy='45' r='8' fill='none' stroke='%23ffffff' stroke-opacity='0.3' stroke-width='1'/%3E%3C/svg%3E")`,
                    backgroundSize: "60px 60px",
                  }}
                />
              </div>

              {/* Gradient Orbs */}
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-orange-500/20 to-transparent blur-3xl" />
              <div className="absolute -bottom-10 left-1/4 h-40 w-40 rounded-full bg-gradient-to-tr from-bordeaux-600/30 to-transparent blur-2xl" />

              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                      <Image
                        src="/images/logo.png"
                        alt="Yibei Tea"
                        width={24}
                        height={24}
                        className="opacity-90"
                      />
                    </div>
                    <span className="text-sm font-medium uppercase tracking-widest text-orange-300">
                      Welkom terug
                    </span>
                  </div>
                  <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
                    {firstName}
                  </h1>
                  <p className="max-w-md text-bordeaux-200/70">
                    Beheer je account, bekijk bestellingen en ontdek je beloningen
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="font-serif text-3xl font-bold text-white">
                      {loyaltyPoints}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-bordeaux-300">
                      Punten
                    </p>
                  </div>
                  <div className="h-12 w-px bg-bordeaux-700" />
                  <div className="text-center">
                    <p className="font-serif text-3xl font-bold text-orange-400">
                      {orders?.length ?? 0}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-bordeaux-300">
                      Orders
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column - Loyalty Card */}
            <div className="lg:col-span-4">
              <div
                className="opacity-0 animate-fade-up"
                style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
              >
                {/* Loyalty Card */}
                <div
                  className={`group relative overflow-hidden rounded-2xl ${currentTierConfig.glow} transition-all duration-500 hover:scale-[1.02]`}
                >
                  {/* Card Background */}
                  <div className={`relative bg-gradient-to-br ${currentTierConfig.cardBg} p-6`}>
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)`,
                        }}
                      />
                    </div>

                    {/* Card Header */}
                    <div className="relative mb-6 flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-widest text-white/60">
                          Yibei Tea
                        </p>
                        <p className="mt-1 font-serif text-xl font-medium text-white">
                          {currentTierConfig.label}
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                        <TierIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    {/* Points Display */}
                    <div className="relative">
                      {loyaltyLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                        </div>
                      ) : (
                        <>
                          <p className="font-serif text-5xl font-bold tracking-tight text-white">
                            {loyaltyPoints.toLocaleString()}
                          </p>
                          <p className="mt-1 text-sm text-white/60">punten beschikbaar</p>

                          {tierInfo.next && (
                            <div className="mt-6 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-white/70">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  Naar {tierInfo.next}
                                </span>
                                <span className="font-medium text-white/90">
                                  {Math.max(0, tierInfo.target - loyaltyPoints)} te gaan
                                </span>
                              </div>
                              <div className="relative h-2 overflow-hidden rounded-full bg-white/20">
                                <div
                                  className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${currentTierConfig.gradient}`}
                                  style={{ width: `${progressPercent}%` }}
                                >
                                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                </div>
                              </div>
                            </div>
                          )}

                          {loyaltyTier === "GOLD" && (
                            <div className="mt-5 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
                              <Sparkles className="h-4 w-4 text-yellow-300" />
                              <p className="text-xs font-medium text-white/90">
                                Hoogste niveau bereikt!
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="relative mt-6 border-t border-white/10 pt-4">
                      <p className="text-xs text-white/50">
                        Lid sinds{" "}
                        {session?.user?.createdAt
                          ? new Date(session.user.createdAt).toLocaleDateString("nl-BE", {
                              month: "long",
                              year: "numeric",
                            })
                          : "2024"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rewards Button */}
                <Link href="/account/rewards" className="mt-4 block">
                  <Button className="w-full bg-gradient-to-r from-bordeaux-600 to-bordeaux-700 text-white hover:from-bordeaux-700 hover:to-bordeaux-800">
                    <Gift className="mr-2 h-4 w-4" />
                    Bekijk Beloningen
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column - Actions & Orders */}
            <div className="space-y-6 lg:col-span-8">
              {/* Quick Action Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Orders Card */}
                <div
                  className="opacity-0 animate-fade-up"
                  style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
                >
                  <Link href="/account/orders" className="group block h-full">
                    <div className="relative h-full overflow-hidden rounded-2xl border border-tea-100/80 bg-white p-6 shadow-soft transition-all duration-300 hover:border-tea-200 hover:shadow-soft-lg hover:-translate-y-0.5">
                      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-tea-100 to-tea-50 transition-transform duration-500 group-hover:scale-125" />
                      <div className="relative">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-tea-500 to-tea-600 shadow-lg shadow-tea-500/20">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-serif text-lg font-medium text-foreground">
                          {t("orders.title")}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Bekijk je recente bestellingen
                        </p>
                        <div className="mt-4 flex items-center text-sm font-medium text-tea-600">
                          Bekijken
                          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Favorites Card */}
                <div
                  className="opacity-0 animate-fade-up"
                  style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
                >
                  <Link href="/account/favorites" className="group block h-full">
                    <div className="relative h-full overflow-hidden rounded-2xl border border-rose-100/80 bg-white p-6 shadow-soft transition-all duration-300 hover:border-rose-200 hover:shadow-soft-lg hover:-translate-y-0.5">
                      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-rose-100 to-rose-50 transition-transform duration-500 group-hover:scale-125" />
                      <div className="relative">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/20">
                          <Heart className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-serif text-lg font-medium text-foreground">
                          {t("favorites.title")}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Je favoriete drankjes
                        </p>
                        <div className="mt-4 flex items-center text-sm font-medium text-rose-600">
                          Bekijken
                          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Recent Orders */}
              <div
                className="opacity-0 animate-fade-up"
                style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
              >
                <div className="overflow-hidden rounded-2xl border border-tea-100/80 bg-white shadow-soft">
                  <div className="flex items-center justify-between border-b border-tea-50 px-6 py-4">
                    <h2 className="font-serif text-lg font-medium text-foreground">
                      Recente Bestellingen
                    </h2>
                    <Link href="/account/orders">
                      <Button variant="ghost" size="sm" className="text-bordeaux-600 hover:text-bordeaux-700 hover:bg-bordeaux-50">
                        Alles bekijken
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="divide-y divide-tea-50">
                    {ordersLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-bordeaux-600" />
                      </div>
                    ) : recentOrders.length > 0 ? (
                      recentOrders.map((order, idx) => (
                        <div
                          key={order.id}
                          className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-cream-50/50"
                        >
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cream-100 to-tea-100">
                            <Coffee className="h-5 w-5 text-tea-600" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-foreground">
                                {order.orderNumber}
                              </p>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-medium ${
                                  statusColors[order.status as keyof typeof statusColors]
                                }`}
                              >
                                {statusLabels[order.status as keyof typeof statusLabels]}
                              </Badge>
                            </div>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                              {order.items
                                .slice(0, 2)
                                .map((item) => item.product?.slug || "Product")
                                .join(", ")}
                              {order.items.length > 2 && ` +${order.items.length - 2}`}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground/70">
                              {new Date(order.createdAt).toLocaleDateString("nl-BE", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-serif text-lg font-semibold text-foreground">
                              &euro;{Number(order.total).toFixed(2)}
                            </p>
                            {order.pointsEarned > 0 && (
                              <p className="flex items-center justify-end gap-1 text-xs font-medium text-orange-600">
                                <Sparkles className="h-3 w-3" />
                                +{order.pointsEarned}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-100">
                          <Coffee className="h-8 w-8 text-tea-400" />
                        </div>
                        <p className="font-medium text-foreground">
                          Nog geen bestellingen
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Je eerste bestelling wacht op je!
                        </p>
                        <Link href="/menu" className="mt-4">
                          <Button className="bg-bordeaux-600 hover:bg-bordeaux-700">
                            Bekijk Menu
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Points History */}
          {loyaltyInfo?.transactions && loyaltyInfo.transactions.length > 0 && (
            <div
              className="mt-6 opacity-0 animate-fade-up"
              style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}
            >
              <div className="overflow-hidden rounded-2xl border border-tea-100/80 bg-white shadow-soft">
                <div className="border-b border-tea-50 px-6 py-4">
                  <h2 className="flex items-center gap-2 font-serif text-lg font-medium text-foreground">
                    <Crown className="h-5 w-5 text-bordeaux-600" />
                    Punten Geschiedenis
                  </h2>
                </div>
                <div className="divide-y divide-tea-50">
                  {loyaltyInfo.transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {tx.description || tx.type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("nl-BE", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={`flex items-center gap-1 font-serif text-lg font-semibold ${
                          tx.points > 0 ? "text-orange-600" : "text-rose-600"
                        }`}
                      >
                        {tx.points > 0 && <Sparkles className="h-4 w-4" />}
                        {tx.points > 0 ? "+" : ""}
                        {tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          <div
            className="mt-8 opacity-0 animate-fade-up"
            style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}
          >
            <Link href="/account/settings">
              <Button variant="outline" className="border-tea-200 bg-white hover:bg-cream-50">
                <Settings className="mr-2 h-4 w-4" />
                {t("settings.title")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
