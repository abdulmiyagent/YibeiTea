"use client";

import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc";
import {
  Package,
  ArrowLeft,
  Loader2,
  Coffee,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

const statusConfig = {
  PENDING: {
    label: { nl: "In afwachting", en: "Pending" },
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  PAID: {
    label: { nl: "Betaald", en: "Paid" },
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CreditCard,
  },
  PREPARING: {
    label: { nl: "In bereiding", en: "Preparing" },
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: ChefHat,
  },
  READY: {
    label: { nl: "Klaar voor afhalen", en: "Ready for pickup" },
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: { nl: "Afgehaald", en: "Completed" },
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: { nl: "Geannuleerd", en: "Cancelled" },
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

type OrderStatus = keyof typeof statusConfig;

export default function AccountOrdersPage() {
  const t = useTranslations("account");
  const locale = useLocale() as "nl" | "en";
  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch user's orders
  const { data: orders, isLoading } = api.orders.getMyOrders.useQuery(
    undefined,
    { enabled: status === "authenticated" }
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="flex items-center justify-center py-20">
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

  return (
    <div className="section-padding">
      <div className="container-custom max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {locale === "nl" ? "Terug naar account" : "Back to account"}
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tea-100">
              <Package className="h-6 w-6 text-tea-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-tea-900">
                {locale === "nl" ? "Mijn Bestellingen" : "My Orders"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {locale === "nl"
                  ? `${orders?.length || 0} bestellingen in totaal`
                  : `${orders?.length || 0} orders total`}
              </p>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status as OrderStatus];
              const StatusIcon = statusInfo?.icon || Clock;

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                          <Coffee className="h-4 w-4 text-tea-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString(
                              locale === "nl" ? "nl-BE" : "en-GB",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`${statusInfo?.color} border flex items-center gap-1.5`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo?.label[locale]}
                      </Badge>
                    </div>

                    {/* Order Items */}
                    <div className="px-4 py-3">
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-tea-600">
                                {item.quantity}x
                              </span>
                              <span className="text-gray-700">
                                {item.product?.translations?.[0]?.name ||
                                  item.product?.slug ||
                                  "Product"}
                              </span>
                            </div>
                            <span className="text-gray-600">
                              €{Number(item.totalPrice).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Order customizations summary */}
                      {order.items.some((item) => item.customizations) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {order.items.map((item, idx) => {
                            const customizations = item.customizations as {
                              sugarLevel?: number;
                              iceLevel?: string;
                              toppings?: string[];
                            } | null;
                            if (!customizations) return null;
                            return (
                              <div key={idx} className="flex gap-1">
                                {customizations.sugarLevel !== undefined && (
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                    {customizations.sugarLevel}%
                                  </span>
                                )}
                                {customizations.iceLevel && (
                                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
                                    {customizations.iceLevel}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Order Footer */}
                    <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/30 px-4 py-3">
                      <div className="text-sm">
                        {order.pointsEarned > 0 && (
                          <span className="text-matcha-600 font-medium">
                            +{order.pointsEarned}{" "}
                            {locale === "nl" ? "punten verdiend" : "points earned"}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-tea-600">
                          €{Number(order.total).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cream-100">
              <ShoppingBag className="h-8 w-8 text-cream-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {locale === "nl"
                ? "Nog geen bestellingen"
                : "No orders yet"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {locale === "nl"
                ? "Bestel je eerste bubble tea!"
                : "Order your first bubble tea!"}
            </p>
            <Link href="/menu">
              <Button variant="tea" className="mt-6 rounded-full">
                {locale === "nl" ? "Bekijk menu" : "View menu"}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
