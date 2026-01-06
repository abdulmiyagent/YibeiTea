"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import {
  Gift,
  Crown,
  ArrowLeft,
  Loader2,
  Coffee,
  Percent,
  ArrowUp,
  Sparkles,
  ShoppingBag,
  Check,
  Lock,
} from "lucide-react";
import Link from "next/link";

const rewardTypeIcons: Record<string, React.ReactNode> = {
  FREE_TOPPING: <Sparkles className="h-6 w-6" />,
  DISCOUNT: <Percent className="h-6 w-6" />,
  SIZE_UPGRADE: <ArrowUp className="h-6 w-6" />,
  FREE_DRINK: <Coffee className="h-6 w-6" />,
};

const rewardTypeColors: Record<string, string> = {
  FREE_TOPPING: "bg-taro-100 text-taro-600",
  DISCOUNT: "bg-matcha-100 text-matcha-600",
  SIZE_UPGRADE: "bg-honey-100 text-honey-600",
  FREE_DRINK: "bg-tea-100 text-tea-600",
};

export default function RewardsPage() {
  const { status } = useSession();
  const router = useRouter();

  // Fetch user's loyalty info
  const { data: loyaltyInfo, isLoading: loyaltyLoading } = api.users.getLoyaltyInfo.useQuery(
    undefined,
    { enabled: status === "authenticated" }
  );

  // Fetch available rewards
  const { data: rewards, isLoading: rewardsLoading } = api.rewards.getAll.useQuery(
    { locale: "nl" },
    { enabled: status === "authenticated" }
  );

  if (status === "loading" || loyaltyLoading || rewardsLoading) {
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

  const userPoints = loyaltyInfo?.loyaltyPoints ?? 0;
  const userTier = loyaltyInfo?.loyaltyTier ?? "BRONZE";

  const tierColors = {
    BRONZE: "bg-amber-100 text-amber-800",
    SILVER: "bg-gray-100 text-gray-800",
    GOLD: "bg-yellow-100 text-yellow-800",
  };

  // Calculate points to next tier
  const pointsToNextTier = {
    BRONZE: Math.max(0, 500 - userPoints),
    SILVER: Math.max(0, 1000 - userPoints),
    GOLD: 0,
  };

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar account
            </Button>
          </Link>
          <h1 className="heading-1 flex items-center gap-3">
            <Gift className="h-8 w-8 text-tea-600" />
            Beloningen
          </h1>
          <p className="mt-2 text-muted-foreground">
            Bekijk beschikbare beloningen en gebruik ze bij je volgende bestelling
          </p>
        </div>

        {/* Points Overview */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-tea-100 p-4">
                  <Crown className="h-8 w-8 text-tea-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jouw punten</p>
                  <p className="text-4xl font-bold text-tea-600">{userPoints}</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <Badge className={`${tierColors[userTier as keyof typeof tierColors]} px-4 py-2 text-base mb-2`}>
                  {userTier} Lid
                </Badge>
                {userTier !== "GOLD" && (
                  <p className="text-sm text-muted-foreground">
                    Nog {pointsToNextTier[userTier as keyof typeof pointsToNextTier]} punten naar {userTier === "BRONZE" ? "Silver" : "Gold"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA to order */}
        <Card className="mb-8 border-tea-200 bg-tea-50">
          <CardContent className="flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-tea-600" />
              <div>
                <p className="font-medium text-tea-800">Klaar om te bestellen?</p>
                <p className="text-sm text-tea-600">
                  Gebruik je punten bij het afrekenen voor korting!
                </p>
              </div>
            </div>
            <Link href="/menu">
              <Button variant="tea">
                Bekijk Menu
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Rewards Grid */}
        <h2 className="mb-4 text-xl font-semibold">Beschikbare Beloningen</h2>

        {rewards && rewards.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => {
              const canAfford = userPoints >= reward.pointsCost;
              const iconColor = rewardTypeColors[reward.rewardType] || "bg-gray-100 text-gray-600";

              return (
                <Card
                  key={reward.id}
                  className={`relative transition-all ${!canAfford ? "opacity-60" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className={`rounded-xl p-3 ${iconColor}`}>
                        {rewardTypeIcons[reward.rewardType] || <Gift className="h-6 w-6" />}
                      </div>
                      <Badge variant="secondary" className="text-lg font-bold">
                        {reward.pointsCost} pts
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{reward.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {reward.description}
                      </p>
                    </div>

                    {/* Value display */}
                    {reward.rewardType === "DISCOUNT" && (
                      <p className="text-matcha-600 font-medium">
                        Waarde: €{reward.rewardValue.toFixed(2)} korting
                      </p>
                    )}

                    {/* Status indicator instead of button */}
                    <div
                      className={`flex items-center justify-center gap-2 rounded-lg p-3 text-sm font-medium ${
                        canAfford
                          ? "bg-matcha-50 text-matcha-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {canAfford ? (
                        <>
                          <Check className="h-4 w-4" />
                          Beschikbaar bij checkout
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Nog {reward.pointsCost - userPoints} punten nodig
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">Geen beloningen beschikbaar</p>
              <p className="text-muted-foreground">
                Kom later terug voor nieuwe beloningen!
              </p>
            </CardContent>
          </Card>
        )}

        {/* How it works */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Hoe werkt het?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-tea-100">
                  <Coffee className="h-6 w-6 text-tea-600" />
                </div>
                <h4 className="font-medium">1. Bestel</h4>
                <p className="text-sm text-muted-foreground">
                  Verdien 10 punten per euro
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-tea-100">
                  <Crown className="h-6 w-6 text-tea-600" />
                </div>
                <h4 className="font-medium">2. Spaar</h4>
                <p className="text-sm text-muted-foreground">
                  Spaar punten en stijg van niveau
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-tea-100">
                  <ShoppingBag className="h-6 w-6 text-tea-600" />
                </div>
                <h4 className="font-medium">3. Checkout</h4>
                <p className="text-sm text-muted-foreground">
                  Kies een beloning bij afrekenen
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-tea-100">
                  <Gift className="h-6 w-6 text-tea-600" />
                </div>
                <h4 className="font-medium">4. Geniet!</h4>
                <p className="text-sm text-muted-foreground">
                  Korting direct toegepast
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Benefits */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Niveau Voordelen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`flex items-center gap-4 rounded-lg border p-4 ${userTier === "BRONZE" ? "border-amber-300 bg-amber-50" : ""}`}>
                <Badge className="bg-amber-100 text-amber-800">Bronze</Badge>
                <div className="flex-1">
                  <p className="font-medium">0 - 499 punten</p>
                  <p className="text-sm text-muted-foreground">
                    10 punten per euro besteed
                  </p>
                </div>
                {userTier === "BRONZE" && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">Huidig niveau</Badge>
                )}
              </div>
              <div className={`flex items-center gap-4 rounded-lg border p-4 ${userTier === "SILVER" ? "border-gray-400 bg-gray-50" : ""}`}>
                <Badge className="bg-gray-200 text-gray-800">Silver</Badge>
                <div className="flex-1">
                  <p className="font-medium">500 - 999 punten</p>
                  <p className="text-sm text-muted-foreground">
                    12 punten per euro besteed + verjaardagsbeloning
                  </p>
                </div>
                {userTier === "SILVER" && (
                  <Badge variant="outline" className="text-gray-600 border-gray-400">Huidig niveau</Badge>
                )}
              </div>
              <div className={`flex items-center gap-4 rounded-lg border p-4 ${userTier === "GOLD" ? "border-yellow-400 bg-yellow-50" : ""}`}>
                <Badge className="bg-yellow-100 text-yellow-800">Gold</Badge>
                <div className="flex-1">
                  <p className="font-medium">1000+ punten</p>
                  <p className="text-sm text-muted-foreground">
                    15 punten per euro + verjaardagsbeloning + exclusieve aanbiedingen
                  </p>
                </div>
                {userTier === "GOLD" && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-400">Huidig niveau</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
