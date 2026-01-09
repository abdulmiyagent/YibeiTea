"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Loader2,
  RefreshCw,
  Volume2,
  VolumeX,
  Timer,
  Sparkles,
  Coffee,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus = "PENDING" | "PAID" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

interface OrderItem {
  id: string;
  quantity: number;
  customizations: unknown;
  product?: {
    slug: string;
    translations?: { name: string }[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string | null;
  total: number | { toNumber?: () => number };
  pickupTime: Date | null;
  createdAt: Date;
  notes: string | null;
  items: OrderItem[];
}

const POLLING_INTERVAL = 5000;

export default function AdminOrdersPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const t = useTranslations("admin.orders");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastOrderCountRef = useRef<number>(0);

  // Update clock every second for pickup timers
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.wav");
    audioRef.current.volume = 0.7;
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Fetch orders
  const {
    data: orders,
    isLoading,
    refetch,
  } = api.orders.getAll.useQuery(
    { limit: 100 },
    {
      enabled: authStatus === "authenticated" && ["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role || ""),
      refetchInterval: POLLING_INTERVAL,
    }
  );

  // Play sound on new order
  useEffect(() => {
    if (!orders) return;
    const activeOrders = orders.filter(o => ["PAID", "PREPARING", "READY"].includes(o.status));
    if (lastOrderCountRef.current > 0 && activeOrders.length > lastOrderCountRef.current) {
      if (soundEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    }
    lastOrderCountRef.current = activeOrders.length;
  }, [orders, soundEnabled]);

  // Update status mutation
  const updateStatusMutation = api.orders.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-tea-50 via-cream-100 to-matcha-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Coffee className="h-16 w-16 text-tea-600 animate-gentle-pulse" />
            <Sparkles className="h-6 w-6 text-tea-400 absolute -top-1 -right-1 animate-float" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-tea-500" />
        </div>
      </div>
    );
  }

  if (authStatus === "unauthenticated" || !["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role || "")) {
    router.push("/");
    return null;
  }

  // Categorize orders
  const paidOrders = (orders || []).filter(o => o.status === "PAID");
  const preparingOrders = (orders || []).filter(o => o.status === "PREPARING");
  const readyOrders = (orders || []).filter(o => o.status === "READY");

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const getMinutesUntilPickup = (pickupTime: Date | null): number | null => {
    if (!pickupTime) return null;
    const pickup = new Date(pickupTime).getTime();
    const diff = (pickup - now.getTime()) / 1000 / 60;
    return Math.round(diff);
  };

  const isUrgent = (pickupTime: Date | null): boolean => {
    const mins = getMinutesUntilPickup(pickupTime);
    return mins !== null && mins <= 10 && mins > -30;
  };

  const isOverdue = (pickupTime: Date | null): boolean => {
    const mins = getMinutesUntilPickup(pickupTime);
    return mins !== null && mins < 0;
  };

  // Sort by pickup urgency
  const sortByUrgency = (a: Order, b: Order) => {
    const aTime = a.pickupTime ? new Date(a.pickupTime).getTime() : Infinity;
    const bTime = b.pickupTime ? new Date(b.pickupTime).getTime() : Infinity;
    return aTime - bTime;
  };

  const sortedPaid = [...paidOrders].sort(sortByUrgency);
  const sortedPreparing = [...preparingOrders].sort(sortByUrgency);
  const sortedReady = [...readyOrders].sort(sortByUrgency);

  const totalActive = paidOrders.length + preparingOrders.length + readyOrders.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-tea-50/50 via-cream-100/30 to-matcha-50/50">
      {/* Floating Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-tea-200/50 shadow-soft">
        <div className="mx-auto max-w-[1800px] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Coffee className="h-8 w-8 text-tea-600" />
                  {totalActive > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-bordeaux-600 text-[10px] font-bold text-white">
                      {totalActive}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-tea-900">{t("title")}</h1>
                  <p className="text-xs text-tea-600/70">{t("manage")}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-tea-700 hover:bg-tea-100"
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
                className="text-tea-700 hover:bg-tea-100"
              >
                <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="mx-auto max-w-[1800px] p-4">
        {totalActive === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-matcha-200/50 blur-2xl" />
              <CheckCircle className="relative h-24 w-24 text-matcha-500" />
            </div>
            <p className="text-2xl font-bold text-matcha-700">{t("noOrdersReceived")}</p>
            <p className="mt-2 text-matcha-600/70">Wachtend op nieuwe bestellingen...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Column 1: New Orders (PAID) */}
            <KanbanColumn
              title={t("paid")}
              count={sortedPaid.length}
              icon={<Clock className="h-5 w-5" />}
              color="amber"
              isEmpty={sortedPaid.length === 0}
              emptyText="Geen nieuwe bestellingen"
            >
              {sortedPaid.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  status="PAID"
                  minutesUntilPickup={getMinutesUntilPickup(order.pickupTime)}
                  isUrgent={isUrgent(order.pickupTime)}
                  isOverdue={isOverdue(order.pickupTime)}
                  onAdvance={() => updateOrderStatus(order.id, "PREPARING")}
                  onCancel={() => updateOrderStatus(order.id, "CANCELLED")}
                  isUpdating={updateStatusMutation.isPending}
                  t={t}
                />
              ))}
            </KanbanColumn>

            {/* Column 2: Preparing */}
            <KanbanColumn
              title={t("preparing")}
              count={sortedPreparing.length}
              icon={<ChefHat className="h-5 w-5" />}
              color="orange"
              isEmpty={sortedPreparing.length === 0}
              emptyText="Geen bestellingen in bereiding"
            >
              {sortedPreparing.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  status="PREPARING"
                  minutesUntilPickup={getMinutesUntilPickup(order.pickupTime)}
                  isUrgent={isUrgent(order.pickupTime)}
                  isOverdue={isOverdue(order.pickupTime)}
                  onAdvance={() => updateOrderStatus(order.id, "READY")}
                  onCancel={() => updateOrderStatus(order.id, "CANCELLED")}
                  isUpdating={updateStatusMutation.isPending}
                  t={t}
                />
              ))}
            </KanbanColumn>

            {/* Column 3: Ready */}
            <KanbanColumn
              title={t("ready")}
              count={sortedReady.length}
              icon={<CheckCircle className="h-5 w-5" />}
              color="green"
              isEmpty={sortedReady.length === 0}
              emptyText="Geen bestellingen klaar"
            >
              {sortedReady.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  status="READY"
                  minutesUntilPickup={getMinutesUntilPickup(order.pickupTime)}
                  isUrgent={isUrgent(order.pickupTime)}
                  isOverdue={isOverdue(order.pickupTime)}
                  onAdvance={() => updateOrderStatus(order.id, "COMPLETED")}
                  isUpdating={updateStatusMutation.isPending}
                  t={t}
                />
              ))}
            </KanbanColumn>
          </div>
        )}
      </main>
    </div>
  );
}

// Kanban Column Component
interface KanbanColumnProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: "amber" | "orange" | "green";
  isEmpty: boolean;
  emptyText: string;
  children: React.ReactNode;
}

function KanbanColumn({ title, count, icon, color, isEmpty, emptyText, children }: KanbanColumnProps) {
  const colorClasses = {
    amber: {
      header: "bg-gradient-to-r from-amber-500 to-amber-400",
      badge: "bg-amber-600",
      empty: "text-amber-400",
      border: "border-amber-200/50",
    },
    orange: {
      header: "bg-gradient-to-r from-orange-500 to-tea-500",
      badge: "bg-orange-600",
      empty: "text-orange-400",
      border: "border-orange-200/50",
    },
    green: {
      header: "bg-gradient-to-r from-matcha-500 to-matcha-400",
      badge: "bg-matcha-600",
      empty: "text-matcha-400",
      border: "border-matcha-200/50",
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={cn("flex flex-col rounded-2xl bg-white/70 backdrop-blur-sm border shadow-soft overflow-hidden", classes.border)}>
      {/* Column Header */}
      <div className={cn("px-4 py-3 text-white", classes.header)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-bold text-lg">{title}</span>
          </div>
          {count > 0 && (
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold", classes.badge)}>
              {count}
            </span>
          )}
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-3 space-y-3 min-h-[400px] max-h-[calc(100vh-220px)] overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className={cn("opacity-30 mb-2", classes.empty)}>{icon}</div>
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Order Card Component
interface OrderCardProps {
  order: Order;
  status: "PAID" | "PREPARING" | "READY";
  minutesUntilPickup: number | null;
  isUrgent: boolean;
  isOverdue: boolean;
  onAdvance: () => void;
  onCancel?: () => void;
  isUpdating: boolean;
  t: ReturnType<typeof useTranslations>;
}

function OrderCard({
  order,
  status,
  minutesUntilPickup,
  isUrgent,
  isOverdue,
  onAdvance,
  onCancel,
  isUpdating,
  t,
}: OrderCardProps) {
  const formatCustomizations = (customizations: unknown): string | null => {
    if (!customizations || typeof customizations !== "object") return null;
    const c = customizations as Record<string, unknown>;
    const parts: string[] = [];
    if (c.sugarLevel !== undefined) parts.push(`${c.sugarLevel}%`);
    if (c.iceLevel) parts.push(`${c.iceLevel}`);
    if (c.size) parts.push(`${c.size}`);
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  const total = typeof order.total === "object" && order.total?.toNumber
    ? order.total.toNumber()
    : Number(order.total);

  const pickupTime = order.pickupTime
    ? new Date(order.pickupTime).toLocaleTimeString("nl-BE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const actionLabels = {
    PAID: "Start bereiding",
    PREPARING: "Klaar voor afhalen",
    READY: "Afgehaald",
  };

  const actionIcons = {
    PAID: <ChefHat className="h-4 w-4" />,
    PREPARING: <CheckCircle className="h-4 w-4" />,
    READY: <CheckCircle className="h-4 w-4" />,
  };

  const actionColors = {
    PAID: "bg-gradient-to-r from-orange-500 to-tea-500 hover:from-orange-600 hover:to-tea-600",
    PREPARING: "bg-gradient-to-r from-matcha-500 to-matcha-400 hover:from-matcha-600 hover:to-matcha-500",
    READY: "bg-gradient-to-r from-matcha-600 to-matcha-500 hover:from-matcha-700 hover:to-matcha-600",
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border-2 bg-white p-4 transition-all hover:shadow-soft-lg",
        isOverdue && "border-bordeaux-400 bg-bordeaux-50/50 animate-gentle-pulse",
        isUrgent && !isOverdue && "border-amber-400 bg-amber-50/50",
        !isUrgent && !isOverdue && "border-tea-100"
      )}
    >
      {/* Urgency Glow Effect */}
      {(isUrgent || isOverdue) && (
        <div className={cn(
          "absolute inset-0 rounded-xl opacity-20 blur-xl -z-10",
          isOverdue ? "bg-bordeaux-400" : "bg-amber-400"
        )} />
      )}

      {/* Header: Order Number + Total */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xl font-bold text-tea-900">{order.orderNumber}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-tea-600">{order.customerName || t("guest")}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-tea-700">{formatPrice(total)}</span>
          {pickupTime && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium mt-1",
              isOverdue && "text-bordeaux-600",
              isUrgent && !isOverdue && "text-amber-600",
              !isUrgent && !isOverdue && "text-tea-500"
            )}>
              <Timer className="h-3.5 w-3.5" />
              {pickupTime}
              {minutesUntilPickup !== null && (
                <span className={cn(
                  "ml-1 text-xs",
                  isOverdue ? "text-bordeaux-500" : ""
                )}>
                  ({minutesUntilPickup > 0 ? `${minutesUntilPickup}m` : `${Math.abs(minutesUntilPickup)}m te laat`})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="mb-3 space-y-1.5">
        {order.items.map((item, index) => {
          const productName = item.product?.translations?.[0]?.name || item.product?.slug || "Product";
          const customStr = formatCustomizations(item.customizations);
          return (
            <div key={index} className="flex items-start justify-between text-sm">
              <span className="font-medium text-tea-800">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-tea-100 text-tea-700 text-xs font-bold mr-2">
                  {item.quantity}
                </span>
                {productName}
              </span>
              {customStr && (
                <span className="text-xs text-tea-500 ml-2">{customStr}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          <span className="font-medium">Opmerking:</span> {order.notes}
        </div>
      )}

      {/* Action Button */}
      <div className="flex gap-2">
        <button
          onClick={onAdvance}
          disabled={isUpdating}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg py-3 px-4 text-white font-semibold transition-all",
            "shadow-soft hover:shadow-soft-lg active:scale-[0.98]",
            actionColors[status],
            isUpdating && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {actionIcons[status]}
              <span>{actionLabels[status]}</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </button>

        {onCancel && status !== "READY" && (
          <button
            onClick={onCancel}
            disabled={isUpdating}
            className={cn(
              "flex items-center justify-center rounded-lg p-3 text-bordeaux-500 border-2 border-bordeaux-200 hover:bg-bordeaux-50 transition-all",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
