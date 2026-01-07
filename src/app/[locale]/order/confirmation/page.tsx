"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  MapPin,
  ArrowRight,
  Loader2,
  AlertCircle,
  Crown,
  UserPlus,
  Gift,
} from "lucide-react";

export default function OrderConfirmationPage() {
  const t = useTranslations("order.confirmation");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const { status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === "authenticated";

  const { data: order, isLoading, error } = api.orders.getByOrderNumber.useQuery(
    { orderNumber: orderNumber || "" },
    { enabled: !!orderNumber }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="mx-auto max-w-lg text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-tea-600" />
            <p className="mt-4 text-muted-foreground">
              {locale === "nl" ? "Bestelling laden..." : "Loading order..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !order || !orderNumber) {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="heading-1 text-red-700">
              {locale === "nl" ? "Bestelling niet gevonden" : "Order not found"}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {locale === "nl"
                ? "We konden je bestelling niet vinden. Controleer het bestelnummer."
                : "We couldn't find your order. Please check the order number."}
            </p>
            <Link href="/menu" className="mt-8 inline-block">
              <Button variant="tea" size="lg">
                {locale === "nl" ? "Terug naar menu" : "Back to menu"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format pickup time
  const pickupDate = order.pickupTime ? new Date(order.pickupTime) : null;
  const isToday = pickupDate ? new Date().toDateString() === pickupDate.toDateString() : false;
  const pickupTimeStr = pickupDate
    ? pickupDate.toLocaleTimeString(locale === "nl" ? "nl-BE" : "en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const pickupDateStr = pickupDate
    ? isToday
      ? locale === "nl"
        ? "Vandaag"
        : "Today"
      : pickupDate.toLocaleDateString(locale === "nl" ? "nl-BE" : "en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
    : "";

  return (
    <div className="section-padding">
      <div className="container-custom">
        <div className="mx-auto max-w-lg text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-matcha-100">
            <CheckCircle className="h-10 w-10 text-matcha-600" />
          </div>

          <h1 className="heading-1 text-matcha-700">{t("title")}</h1>

          <Card className="mt-8">
            <CardContent className="space-y-6 pt-6">
              {/* Order Number */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">{t("orderNumber")}</p>
                <p className="text-2xl font-bold text-tea-600">{order.orderNumber}</p>
              </div>

              {/* Order Items */}
              <div className="space-y-2 text-left">
                <p className="text-sm font-medium text-muted-foreground">
                  {locale === "nl" ? "Je bestelling" : "Your order"}
                </p>
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>{locale === "nl" ? "Totaal" : "Total"}</span>
                  <span className="text-tea-600">{formatPrice(order.total)}</span>
                </div>
                {order.pointsEarned > 0 && isLoggedIn && (
                  <div className="flex items-center justify-center gap-2 mt-3 rounded-lg bg-matcha-50 p-3">
                    <Crown className="h-4 w-4 text-matcha-600" />
                    <span className="text-sm font-medium text-matcha-700">
                      {locale === "nl"
                        ? `+${order.pointsEarned} loyaliteitspunten verdiend!`
                        : `+${order.pointsEarned} loyalty points earned!`}
                    </span>
                  </div>
                )}

                {/* Guest Account Creation Prompt */}
                {!isLoggedIn && sessionStatus !== "loading" && (
                  <div className="mt-3 rounded-lg border border-tea-200 bg-gradient-to-r from-tea-50 to-cream-50 p-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-tea-100 p-2">
                        <Gift className="h-4 w-4 text-tea-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-tea-800">
                          {locale === "nl"
                            ? "Maak een account aan"
                            : "Create an account"}
                        </p>
                        <p className="mt-0.5 text-sm text-tea-600">
                          {locale === "nl"
                            ? "Verdien loyaliteitspunten bij je volgende bestelling en bekijk je bestelgeschiedenis."
                            : "Earn loyalty points on your next order and view your order history."}
                        </p>
                        <Link href={`/register?email=${encodeURIComponent(order.customerEmail || "")}`}>
                          <Button variant="tea" size="sm" className="mt-3">
                            <UserPlus className="mr-2 h-4 w-4" />
                            {locale === "nl" ? "Account aanmaken" : "Create account"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pickup Info */}
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-tea-600" />
                  <div>
                    <p className="font-medium">{t("pickupTime")}</p>
                    <p className="text-muted-foreground">
                      {pickupDateStr} {locale === "nl" ? "om" : "at"} {pickupTimeStr}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-tea-600" />
                  <div>
                    <p className="font-medium">Yibei Tea</p>
                    <p className="text-muted-foreground">
                      Sint-Niklaasstraat 36
                      <br />
                      9000 Gent
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Confirmation */}
              <p className="text-sm text-muted-foreground">
                {t("emailSent", { email: order.customerEmail })}
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/menu">
              <Button variant="tea" size="lg">
                {t("placeAnother")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            {isLoggedIn && (
              <Link href="/account/orders">
                <Button variant="outline" size="lg">
                  {t("viewOrders")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
