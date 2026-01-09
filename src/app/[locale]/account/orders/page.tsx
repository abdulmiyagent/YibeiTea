"use client";

import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  CreditCard,
  Sparkles,
} from "lucide-react";

const statusConfig = {
  PENDING: {
    label: { nl: "In afwachting", en: "Pending", ne: "पर्खिँदै" },
    gradient: "from-amber-400 to-orange-400",
    bg: "bg-gradient-to-br from-amber-50 to-orange-50",
    border: "border-amber-200/60",
    text: "text-amber-700",
    icon: Clock,
    glow: "shadow-amber-200/50",
  },
  PAID: {
    label: { nl: "Betaald", en: "Paid", ne: "भुक्तान भयो" },
    gradient: "from-sky-400 to-blue-500",
    bg: "bg-gradient-to-br from-sky-50 to-blue-50",
    border: "border-sky-200/60",
    text: "text-sky-700",
    icon: CreditCard,
    glow: "shadow-sky-200/50",
  },
  PREPARING: {
    label: { nl: "In bereiding", en: "Preparing", ne: "तयारी हुँदैछ" },
    gradient: "from-orange-400 to-rose-400",
    bg: "bg-gradient-to-br from-orange-50 to-rose-50",
    border: "border-orange-200/60",
    text: "text-orange-700",
    icon: ChefHat,
    glow: "shadow-orange-200/50",
  },
  READY: {
    label: { nl: "Klaar voor afhalen", en: "Ready for pickup", ne: "उठाउन तयार" },
    gradient: "from-emerald-400 to-teal-500",
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
    border: "border-emerald-200/60",
    text: "text-emerald-700",
    icon: CheckCircle2,
    glow: "shadow-emerald-200/50",
  },
  COMPLETED: {
    label: { nl: "Afgehaald", en: "Completed", ne: "पूरा भयो" },
    gradient: "from-slate-400 to-slate-500",
    bg: "bg-gradient-to-br from-slate-50 to-gray-100",
    border: "border-slate-200/60",
    text: "text-slate-600",
    icon: CheckCircle2,
    glow: "shadow-slate-200/50",
  },
  CANCELLED: {
    label: { nl: "Geannuleerd", en: "Cancelled", ne: "रद्द गरियो" },
    gradient: "from-red-400 to-rose-500",
    bg: "bg-gradient-to-br from-red-50 to-rose-50",
    border: "border-red-200/60",
    text: "text-red-600",
    icon: XCircle,
    glow: "shadow-red-200/50",
  },
};

type OrderStatus = keyof typeof statusConfig;

// Decorative boba SVG component
function BobaBubbles({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <circle cx="20" cy="30" r="8" className="fill-tea-200/40" />
      <circle cx="45" cy="15" r="6" className="fill-taro-200/40" />
      <circle cx="70" cy="35" r="10" className="fill-matcha-200/40" />
      <circle cx="85" cy="60" r="7" className="fill-tea-300/30" />
      <circle cx="30" cy="70" r="9" className="fill-taro-300/30" />
      <circle cx="60" cy="80" r="5" className="fill-matcha-300/30" />
    </svg>
  );
}

export default function AccountOrdersPage() {
  const locale = useLocale() as "nl" | "en" | "ne";
  const { status } = useSession();
  const router = useRouter();

  const { data: orders, isLoading } = api.orders.getMyOrders.useQuery(
    undefined,
    { enabled: status === "authenticated" }
  );

  const text = {
    backToAccount: { nl: "Terug naar account", en: "Back to account", ne: "खातामा फर्कनुहोस्" },
    myOrders: { nl: "Mijn Bestellingen", en: "My Orders", ne: "मेरो अर्डरहरू" },
    orderHistory: { nl: "Je bestelgeschiedenis", en: "Your order history", ne: "तपाईंको अर्डर इतिहास" },
    ordersTotal: { nl: "bestellingen", en: "orders", ne: "अर्डरहरू" },
    noOrders: { nl: "Nog geen bestellingen", en: "No orders yet", ne: "अहिलेसम्म कुनै अर्डर छैन" },
    firstBubbleTea: { nl: "Tijd voor je eerste bubble tea!", en: "Time for your first bubble tea!", ne: "तपाईंको पहिलो बबल टी को समय!" },
    viewMenu: { nl: "Bekijk menu", en: "View menu", ne: "मेनु हेर्नुहोस्" },
    pointsEarned: { nl: "punten verdiend", en: "points earned", ne: "अंक कमाइयो" },
    sugar: { nl: "suiker", en: "sugar", ne: "चिनी" },
    noIce: { nl: "geen ijs", en: "no ice", ne: "बरफ छैन" },
    lessIce: { nl: "minder ijs", en: "less ice", ne: "कम बरफ" },
    extraIce: { nl: "extra ijs", en: "extra ice", ne: "थप बरफ" },
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl opacity-40 bg-gradient-to-r from-tea-300 via-taro-300 to-matcha-300 rounded-full animate-pulse" />
          <Loader2 className="relative h-10 w-10 animate-spin text-tea-600" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-tea-100/50 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-taro-100/40 via-transparent to-transparent rounded-full blur-3xl" />
        <BobaBubbles className="absolute top-20 right-10 w-32 h-32 opacity-60" />
        <BobaBubbles className="absolute bottom-40 left-5 w-24 h-24 opacity-40 rotate-45" />
      </div>

      <div className="relative section-padding">
        <div className="container-custom max-w-2xl">
          {/* Header */}
          <div className="mb-10">
            <Link href="/account">
              <Button
                variant="ghost"
                size="sm"
                className="mb-6 -ml-2 text-muted-foreground hover:text-bordeaux-700 hover:bg-bordeaux-50 transition-colors group"
              >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                {text.backToAccount[locale]}
              </Button>
            </Link>

            <div className="relative">
              {/* Decorative element behind title */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-tea-400 via-taro-400 to-matcha-400 rounded-full" />

              <div className="pl-4">
                <h1 className="font-serif text-3xl md:text-4xl font-medium text-bordeaux-900 tracking-tight">
                  {text.myOrders[locale]}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {text.orderHistory[locale]}
                  <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cream-200/60 text-sm font-medium text-tea-800">
                    {orders?.length || 0} {text.ordersTotal[locale]}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {orders && orders.length > 0 ? (
            <div className="space-y-5">
              {orders.map((order, orderIndex) => {
                const statusInfo = statusConfig[order.status as OrderStatus];
                const StatusIcon = statusInfo?.icon || Clock;

                return (
                  <article
                    key={order.id}
                    className="group relative rounded-2xl bg-white/80 backdrop-blur-sm border border-cream-200/80 shadow-soft hover:shadow-soft-lg transition-all duration-500 overflow-hidden"
                    style={{
                      animationDelay: `${orderIndex * 80}ms`,
                    }}
                  >
                    {/* Subtle gradient accent on left */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${statusInfo?.gradient || "from-tea-400 to-tea-500"}`} />

                    {/* Order Header */}
                    <div className="px-5 py-4 border-b border-cream-100">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm font-semibold text-bordeaux-800 tracking-wide">
                            {order.orderNumber}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString(
                              locale === "nl" ? "nl-BE" : locale === "ne" ? "ne-NP" : "en-GB",
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

                        {/* Status Badge */}
                        <div className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                          ${statusInfo?.bg} ${statusInfo?.border} ${statusInfo?.text}
                          border shadow-sm ${statusInfo?.glow}
                          transition-all duration-300 group-hover:scale-105
                        `}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{statusInfo?.label[locale]}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="px-5 py-4">
                      <div className="space-y-3">
                        {order.items.map((item, idx) => {
                          const customizations = item.customizations as {
                            sugarLevel?: number;
                            iceLevel?: string;
                            toppings?: string[];
                          } | null;

                          const hasCustomizations =
                            customizations &&
                            ((customizations.sugarLevel !== undefined && customizations.sugarLevel !== 100) ||
                              (customizations.iceLevel && customizations.iceLevel !== "NORMAL_ICE" && customizations.iceLevel !== "normal") ||
                              (customizations.toppings && customizations.toppings.length > 0));

                          return (
                            <div
                              key={idx}
                              className="flex items-start justify-between gap-3"
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {/* Quantity bubble */}
                                <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-tea-100 text-tea-700 text-xs font-bold">
                                  {item.quantity}
                                </span>

                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 leading-snug">
                                    {item.product?.translations?.[0]?.name ||
                                      item.product?.slug ||
                                      "Product"}
                                  </p>

                                  {hasCustomizations && (
                                    <p className="mt-1 text-xs text-gray-400 leading-relaxed">
                                      {[
                                        customizations.sugarLevel !== undefined &&
                                          customizations.sugarLevel !== 100 &&
                                          `${customizations.sugarLevel}% ${text.sugar[locale]}`,
                                        customizations.iceLevel &&
                                          customizations.iceLevel !== "NORMAL_ICE" &&
                                          customizations.iceLevel !== "normal" &&
                                          (customizations.iceLevel === "NO_ICE"
                                            ? text.noIce[locale]
                                            : customizations.iceLevel === "LESS_ICE"
                                            ? text.lessIce[locale]
                                            : customizations.iceLevel === "EXTRA_ICE"
                                            ? text.extraIce[locale]
                                            : customizations.iceLevel),
                                        customizations.toppings &&
                                          customizations.toppings.length > 0 &&
                                          `+${customizations.toppings.length} topping${customizations.toppings.length > 1 ? "s" : ""}`,
                                      ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <span className="text-sm font-medium text-gray-600 tabular-nums">
                                €{Number(item.totalPrice).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Footer */}
                    <div className="px-5 py-3 bg-gradient-to-r from-cream-50/80 to-tea-50/50 border-t border-cream-100">
                      <div className="flex items-center justify-between">
                        {order.pointsEarned > 0 ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Sparkles className="h-4 w-4 text-matcha-500" />
                            <span className="font-medium text-matcha-700">
                              +{order.pointsEarned} {text.pointsEarned[locale]}
                            </span>
                          </div>
                        ) : (
                          <div />
                        )}

                        <p className="text-xl font-serif font-semibold text-bordeaux-800">
                          €{Number(order.total).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="relative rounded-3xl border-2 border-dashed border-cream-300 bg-gradient-to-br from-cream-50 to-tea-50/30 py-16 px-8 text-center overflow-hidden">
              {/* Decorative bubbles */}
              <BobaBubbles className="absolute top-4 right-4 w-20 h-20 opacity-50" />
              <BobaBubbles className="absolute bottom-4 left-4 w-16 h-16 opacity-40 rotate-90" />

              <div className="relative">
                {/* Cup illustration */}
                <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-tea-100 to-taro-100 flex items-center justify-center shadow-soft">
                  <svg className="w-10 h-10 text-tea-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 8H19C20.1046 8 21 8.89543 21 10V11C21 12.1046 20.1046 13 19 13H17" strokeLinecap="round" />
                    <path d="M5 8H17V16C17 18.2091 15.2091 20 13 20H9C6.79086 20 5 18.2091 5 16V8Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 8L6 4H16L17 8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="8" cy="14" r="1" fill="currentColor" />
                    <circle cx="11" cy="12" r="1" fill="currentColor" />
                    <circle cx="14" cy="15" r="1" fill="currentColor" />
                  </svg>
                </div>

                <h3 className="font-serif text-xl font-medium text-bordeaux-800">
                  {text.noOrders[locale]}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                  {text.firstBubbleTea[locale]}
                </p>

                <Link href="/menu">
                  <Button
                    variant="default"
                    className="mt-6 rounded-full bg-gradient-to-r from-tea-500 to-tea-600 hover:from-tea-600 hover:to-tea-700 shadow-lg shadow-tea-200/50 px-6"
                  >
                    {text.viewMenu[locale]}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
