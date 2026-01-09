"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  RefreshCw,
  AlertTriangle,
  Package,
  Loader2,
  Timer,
  Maximize,
  Minimize,
  ArrowLeft,
  HandPlatter,
} from "lucide-react";
import Link from "next/link";

type CancellationReason = "BUSY" | "OUT_OF_STOCK" | "CUSTOMER_REQUEST" | "OTHER";

interface ActiveOrder {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  total: number;
  pickupTime: Date | null;
  createdAt: Date;
  notes: string | null;
  items: {
    id: string;
    quantity: number;
    productName: string;
    customizations: Record<string, unknown> | null;
  }[];
}

const POLLING_INTERVAL = 5000; // 5 seconds - faster for active page
const CANCEL_WINDOW_MINUTES = 30;

export default function ActiveOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("admin.activeOrders");
  const tOrders = useTranslations("admin.orders");

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<ActiveOrder | null>(null);
  const [cancelReason, setCancelReason] = useState<CancellationReason>("BUSY");
  const [customReason, setCustomReason] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastOrderCountRef = useRef<number>(0);
  const lastOrderIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auth check
  useEffect(() => {
    if (status === "loading") return;
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      router.push("/");
    }
  }, [session, status, router]);

  // Fetch active orders (PAID + PREPARING)
  const {
    data: orders,
    isLoading,
    refetch,
    dataUpdatedAt,
  } = api.orders.getActiveOrders.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: true,
  });

  // Fetch ready orders (awaiting pickup)
  const { data: readyOrders, refetch: refetchReady } = api.orders.getAll.useQuery(
    { status: "READY", limit: 20 },
    {
      refetchInterval: POLLING_INTERVAL,
      refetchIntervalInBackground: true,
    }
  );

  // Fetch order count for new order detection
  const { data: orderCount } = api.orders.getActiveOrderCount.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: true,
  });

  // Update last refresh time
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastRefresh(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  // Mutations
  const updateStatusMutation = api.orders.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      refetchReady();
    },
  });

  const cancelOrderMutation = api.orders.cancelOrder.useMutation({
    onSuccess: () => {
      refetch();
      setCancelDialogOpen(false);
      setOrderToCancel(null);
      setCancelReason("BUSY");
      setCustomReason("");
    },
  });

  const bulkUpdateMutation = api.orders.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      refetch();
      refetchReady();
      setSelectedOrders(new Set());
    },
  });

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.wav");
    audioRef.current.volume = 0.7;

    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Detect new orders and play sound
  useEffect(() => {
    if (!orderCount) return;

    const { count, latestOrderId } = orderCount;

    if (
      lastOrderCountRef.current > 0 &&
      count > lastOrderCountRef.current &&
      latestOrderId !== lastOrderIdRef.current
    ) {
      if (soundEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }

      if (notificationsEnabled && "Notification" in window) {
        const newOrderCount = count - lastOrderCountRef.current;
        new Notification(t("newOrderTitle"), {
          body: t("newOrderBody", { count: newOrderCount }),
          icon: "/images/logo.png",
          tag: "new-order",
        });
      }
    }

    lastOrderCountRef.current = count;
    lastOrderIdRef.current = latestOrderId;
  }, [orderCount, soundEnabled, notificationsEnabled, t]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  }, []);

  // Format customizations
  const formatCustomizations = (customizations: Record<string, unknown> | null): string => {
    if (!customizations) return "";
    const parts: string[] = [];
    if (customizations.sugarLevel !== undefined) parts.push(`${customizations.sugarLevel}%`);
    if (customizations.iceLevel) parts.push(`${customizations.iceLevel}`);
    if (customizations.size) parts.push(`${customizations.size}`);
    if (Array.isArray(customizations.toppings) && customizations.toppings.length > 0) {
      parts.push(`+${customizations.toppings.length} toppings`);
    }
    return parts.join(", ");
  };

  // Calculate time remaining for cancellation
  const getCancelTimeRemaining = (createdAt: Date): number => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const elapsed = (now - created) / 1000 / 60;
    return Math.max(0, CANCEL_WINDOW_MINUTES - elapsed);
  };

  const canCancel = (order: ActiveOrder): boolean => {
    return getCancelTimeRemaining(order.createdAt) > 0;
  };

  const isPickupApproaching = (pickupTime: Date | null): boolean => {
    if (!pickupTime) return false;
    const pickup = new Date(pickupTime).getTime();
    const now = Date.now();
    const diff = (pickup - now) / 1000 / 60;
    return diff <= 5 && diff > -15;
  };

  const isPickupOverdue = (pickupTime: Date | null): boolean => {
    if (!pickupTime) return false;
    const pickup = new Date(pickupTime).getTime();
    return Date.now() > pickup;
  };

  // Handlers
  const handleStatusUpdate = (orderId: string, newStatus: "PREPARING" | "READY" | "COMPLETED") => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleCancelClick = (order: ActiveOrder) => {
    setOrderToCancel(order);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!orderToCancel) return;
    cancelOrderMutation.mutate({
      id: orderToCancel.id,
      reason: cancelReason,
      customReason: cancelReason === "OTHER" ? customReason : undefined,
    });
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkReady = () => {
    if (selectedOrders.size === 0) return;
    bulkUpdateMutation.mutate({
      orderIds: Array.from(selectedOrders),
      status: "READY",
    });
  };

  // Separate orders by status
  const paidOrders = orders?.filter((o) => o.status === "PAID") || [];
  const preparingOrders = orders?.filter((o) => o.status === "PREPARING") || [];
  const readyOrdersList = readyOrders || [];

  const cancellationReasons: { value: CancellationReason; label: string }[] = [
    { value: "BUSY", label: t("cancelReasons.busy") },
    { value: "OUT_OF_STOCK", label: t("cancelReasons.outOfStock") },
    { value: "CUSTOMER_REQUEST", label: t("cancelReasons.customerRequest") },
    { value: "OTHER", label: t("cancelReasons.other") },
  ];

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-tea-600" />
      </div>
    );
  }

  const totalActive = paidOrders.length + preparingOrders.length;

  return (
    <div
      ref={containerRef}
      className={cn(
        "min-h-screen bg-gray-100",
        isFullscreen && "bg-gray-900"
      )}
    >
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50 border-b bg-white px-4 py-3 shadow-sm",
        isFullscreen && "bg-gray-800 border-gray-700"
      )}>
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders">
              <Button variant="ghost" size="icon" className={isFullscreen ? "text-white hover:bg-gray-700" : ""}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Package className={cn("h-6 w-6", isFullscreen ? "text-tea-400" : "text-tea-600")} />
              <h1 className={cn("text-xl font-bold", isFullscreen ? "text-white" : "text-gray-900")}>
                {t("title")}
              </h1>
              {totalActive > 0 && (
                <Badge className="bg-tea-500 text-white text-lg px-3 py-1">
                  {totalActive}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Last refresh */}
            <span className={cn("text-sm", isFullscreen ? "text-gray-400" : "text-muted-foreground")}>
              {lastRefresh.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>

            {/* Sound toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={isFullscreen ? "text-white hover:bg-gray-700" : ""}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>

            {/* Notification toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={notificationsEnabled ? () => setNotificationsEnabled(false) : requestNotificationPermission}
              className={isFullscreen ? "text-white hover:bg-gray-700" : ""}
            >
              {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </Button>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                refetch();
                refetchReady();
              }}
              className={isFullscreen ? "text-white hover:bg-gray-700" : ""}
            >
              <RefreshCw className="h-5 w-5" />
            </Button>

            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className={isFullscreen ? "text-white hover:bg-gray-700" : ""}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Bulk actions bar */}
      {selectedOrders.size > 0 && (
        <div className="sticky top-[61px] z-40 border-b bg-tea-50 px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <span className="font-medium">
              {t("selectedOrders", { count: selectedOrders.size })}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedOrders(new Set())}>
                {t("clearSelection")}
              </Button>
              <Button
                size="sm"
                variant="tea"
                onClick={handleBulkReady}
                disabled={bulkUpdateMutation.isPending}
              >
                {bulkUpdateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {t("markAllReady")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={cn("mx-auto max-w-7xl p-4", isFullscreen && "max-w-none px-6")}>
        {totalActive === 0 && readyOrdersList.length === 0 ? (
          <div className={cn(
            "flex flex-col items-center justify-center py-24 text-center",
            isFullscreen && "py-32"
          )}>
            <CheckCircle className={cn("mb-4 h-20 w-20", isFullscreen ? "text-green-400" : "text-green-500")} />
            <p className={cn("text-2xl font-bold", isFullscreen ? "text-green-400" : "text-green-700")}>
              {t("noActiveOrders")}
            </p>
            <p className={cn("text-lg", isFullscreen ? "text-gray-400" : "text-muted-foreground")}>
              {t("allCaughtUp")}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* New Orders (PAID) */}
            {paidOrders.length > 0 && (
              <section>
                <h2 className={cn(
                  "mb-4 flex items-center gap-2 text-lg font-bold uppercase",
                  isFullscreen ? "text-yellow-400" : "text-yellow-700"
                )}>
                  <Clock className="h-6 w-6" />
                  {t("newOrders")} ({paidOrders.length})
                </h2>
                <div className={cn(
                  "grid gap-4",
                  isFullscreen ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                )}>
                  {paidOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      formatCustomizations={formatCustomizations}
                      canCancel={canCancel(order)}
                      cancelTimeRemaining={getCancelTimeRemaining(order.createdAt)}
                      isPickupApproaching={isPickupApproaching(order.pickupTime)}
                      isPickupOverdue={isPickupOverdue(order.pickupTime)}
                      isSelected={selectedOrders.has(order.id)}
                      onToggleSelect={() => toggleOrderSelection(order.id)}
                      onStart={() => handleStatusUpdate(order.id, "PREPARING")}
                      onCancel={() => handleCancelClick(order)}
                      isUpdating={updateStatusMutation.isPending}
                      isFullscreen={isFullscreen}
                      t={t}
                      tOrders={tOrders}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* In Progress (PREPARING) */}
            {preparingOrders.length > 0 && (
              <section>
                <h2 className={cn(
                  "mb-4 flex items-center gap-2 text-lg font-bold uppercase",
                  isFullscreen ? "text-orange-400" : "text-orange-700"
                )}>
                  <ChefHat className="h-6 w-6" />
                  {t("inProgress")} ({preparingOrders.length})
                </h2>
                <div className={cn(
                  "grid gap-4",
                  isFullscreen ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                )}>
                  {preparingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      formatCustomizations={formatCustomizations}
                      canCancel={canCancel(order)}
                      cancelTimeRemaining={getCancelTimeRemaining(order.createdAt)}
                      isPickupApproaching={isPickupApproaching(order.pickupTime)}
                      isPickupOverdue={isPickupOverdue(order.pickupTime)}
                      isSelected={selectedOrders.has(order.id)}
                      onToggleSelect={() => toggleOrderSelection(order.id)}
                      onReady={() => handleStatusUpdate(order.id, "READY")}
                      onCancel={() => handleCancelClick(order)}
                      isUpdating={updateStatusMutation.isPending}
                      isFullscreen={isFullscreen}
                      t={t}
                      tOrders={tOrders}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Ready for Pickup */}
            {readyOrdersList.length > 0 && (
              <section>
                <h2 className={cn(
                  "mb-4 flex items-center gap-2 text-lg font-bold uppercase",
                  isFullscreen ? "text-green-400" : "text-green-700"
                )}>
                  <HandPlatter className="h-6 w-6" />
                  {t("readyForPickup")} ({readyOrdersList.length})
                </h2>
                <div className={cn(
                  "grid gap-4",
                  isFullscreen ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                )}>
                  {readyOrdersList.map((order) => (
                    <ReadyOrderCard
                      key={order.id}
                      order={order}
                      onComplete={() => handleStatusUpdate(order.id, "COMPLETED")}
                      isUpdating={updateStatusMutation.isPending}
                      isFullscreen={isFullscreen}
                      t={t}
                      tOrders={tOrders}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              {t("cancelOrder")}
            </DialogTitle>
            <DialogDescription>
              {t("cancelOrderDescription", { orderNumber: orderToCancel?.orderNumber })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("cancelReason")}</label>
              <div className="grid grid-cols-2 gap-2">
                {cancellationReasons.map((reason) => (
                  <Button
                    key={reason.value}
                    variant={cancelReason === reason.value ? "tea" : "outline"}
                    size="sm"
                    onClick={() => setCancelReason(reason.value)}
                    className="justify-start"
                  >
                    {reason.label}
                  </Button>
                ))}
              </div>
            </div>

            {cancelReason === "OTHER" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("customReason")}</label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={t("customReasonPlaceholder")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  maxLength={200}
                />
              </div>
            )}

            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <p className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t("cancelWarning")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t("keepOrder")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelOrderMutation.isPending || (cancelReason === "OTHER" && !customReason)}
            >
              {cancelOrderMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              {t("confirmCancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Order Card Component
interface OrderCardProps {
  order: ActiveOrder;
  formatCustomizations: (c: Record<string, unknown> | null) => string;
  canCancel: boolean;
  cancelTimeRemaining: number;
  isPickupApproaching: boolean;
  isPickupOverdue: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onStart?: () => void;
  onReady?: () => void;
  onCancel: () => void;
  isUpdating: boolean;
  isFullscreen: boolean;
  t: ReturnType<typeof useTranslations>;
  tOrders: ReturnType<typeof useTranslations>;
}

function OrderCard({
  order,
  formatCustomizations,
  canCancel,
  cancelTimeRemaining,
  isPickupApproaching,
  isPickupOverdue,
  isSelected,
  onToggleSelect,
  onStart,
  onReady,
  onCancel,
  isUpdating,
  isFullscreen,
  t,
  tOrders,
}: OrderCardProps) {
  const pickupTime = order.pickupTime
    ? new Date(order.pickupTime).toLocaleTimeString("nl-BE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const isPaid = order.status === "PAID";

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-5 transition-all",
        isFullscreen ? "bg-gray-800 border-gray-600" : "bg-white",
        isSelected && "border-tea-500 ring-2 ring-tea-200",
        isPickupOverdue && "border-red-400 bg-red-50",
        isPickupApproaching && !isPickupOverdue && "border-amber-400 bg-amber-50",
        isFullscreen && isPickupOverdue && "bg-red-900/30 border-red-500",
        isFullscreen && isPickupApproaching && !isPickupOverdue && "bg-amber-900/30 border-amber-500"
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-5 w-5 rounded border-gray-300 text-tea-600 focus:ring-tea-500"
          />
          <div>
            <span className={cn(
              "text-xl font-bold",
              isFullscreen ? "text-white" : "text-gray-900"
            )}>
              {order.orderNumber}
            </span>
            <Badge className={cn(
              "ml-2",
              isPaid
                ? "bg-yellow-100 text-yellow-800"
                : "bg-orange-100 text-orange-800"
            )}>
              {isPaid ? tOrders("paid") : tOrders("preparing")}
            </Badge>
          </div>
        </div>
        <span className={cn(
          "text-2xl font-bold",
          isFullscreen ? "text-tea-400" : "text-tea-600"
        )}>
          {formatPrice(order.total)}
        </span>
      </div>

      {/* Customer & Pickup */}
      <div className={cn(
        "mb-4 flex items-center justify-between",
        isFullscreen ? "text-gray-300" : "text-gray-600"
      )}>
        <span className="text-lg font-medium">
          {order.customerName || tOrders("guest")}
        </span>
        {pickupTime && (
          <span
            className={cn(
              "flex items-center gap-1 text-lg font-semibold",
              isPickupOverdue && "text-red-500",
              isPickupApproaching && !isPickupOverdue && "text-amber-500"
            )}
          >
            <Clock className="h-5 w-5" />
            {pickupTime}
            {isPickupOverdue && <AlertTriangle className="ml-1 h-5 w-5" />}
          </span>
        )}
      </div>

      {/* Items */}
      <div className={cn(
        "mb-4 space-y-2 rounded-lg p-3",
        isFullscreen ? "bg-gray-700" : "bg-gray-50"
      )}>
        {order.items.map((item) => {
          const customStr = formatCustomizations(item.customizations);
          return (
            <div key={item.id} className="flex justify-between items-start">
              <span className={cn(
                "text-base font-medium",
                isFullscreen ? "text-white" : "text-gray-900"
              )}>
                {item.quantity}x {item.productName}
              </span>
              {customStr && (
                <span className={cn(
                  "text-sm",
                  isFullscreen ? "text-gray-400" : "text-gray-500"
                )}>
                  {customStr}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className={cn(
          "mb-4 rounded-lg p-3 text-sm italic",
          isFullscreen ? "bg-amber-900/30 text-amber-300" : "bg-amber-50 text-amber-800"
        )}>
          "{order.notes}"
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onStart && (
          <Button
            size="lg"
            variant="tea"
            className="flex-1 text-base"
            onClick={onStart}
            disabled={isUpdating}
          >
            <ChefHat className="mr-2 h-5 w-5" />
            {t("startPreparing")}
          </Button>
        )}
        {onReady && (
          <Button
            size="lg"
            variant="tea"
            className="flex-1 text-base"
            onClick={onReady}
            disabled={isUpdating}
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            {t("markReady")}
          </Button>
        )}
        {canCancel && (
          <Button
            size="lg"
            variant="outline"
            className={cn(
              "text-red-600 hover:bg-red-50 hover:text-red-700",
              isFullscreen && "border-red-500 hover:bg-red-900/30"
            )}
            onClick={onCancel}
            disabled={isUpdating}
          >
            <XCircle className="mr-1 h-5 w-5" />
            <Timer className="mr-1 h-4 w-4" />
            {Math.floor(cancelTimeRemaining)}m
          </Button>
        )}
      </div>
    </div>
  );
}

// Ready Order Card Component
interface ReadyOrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    customerName: string | null;
    total: number | { toNumber: () => number };
    pickupTime: Date | null;
  };
  onComplete: () => void;
  isUpdating: boolean;
  isFullscreen: boolean;
  t: ReturnType<typeof useTranslations>;
  tOrders: ReturnType<typeof useTranslations>;
}

function ReadyOrderCard({
  order,
  onComplete,
  isUpdating,
  isFullscreen,
  t,
  tOrders,
}: ReadyOrderCardProps) {
  const pickupTime = order.pickupTime
    ? new Date(order.pickupTime).toLocaleTimeString("nl-BE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const total = typeof order.total === "object" && "toNumber" in order.total
    ? order.total.toNumber()
    : Number(order.total);

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-5 transition-all",
        isFullscreen
          ? "bg-green-900/30 border-green-600"
          : "bg-green-50 border-green-200"
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span className={cn(
            "text-xl font-bold",
            isFullscreen ? "text-white" : "text-gray-900"
          )}>
            {order.orderNumber}
          </span>
          <Badge className="ml-2 bg-green-100 text-green-800">
            {tOrders("ready")}
          </Badge>
        </div>
        <span className={cn(
          "text-2xl font-bold",
          isFullscreen ? "text-green-400" : "text-green-600"
        )}>
          {formatPrice(total)}
        </span>
      </div>

      <div className={cn(
        "mb-4 flex items-center justify-between",
        isFullscreen ? "text-gray-300" : "text-gray-600"
      )}>
        <span className="text-lg font-medium">
          {order.customerName || tOrders("guest")}
        </span>
        {pickupTime && (
          <span className="flex items-center gap-1 text-lg">
            <Clock className="h-5 w-5" />
            {pickupTime}
          </span>
        )}
      </div>

      <Button
        size="lg"
        className="w-full bg-green-600 hover:bg-green-700 text-white text-base"
        onClick={onComplete}
        disabled={isUpdating}
      >
        <CheckCircle className="mr-2 h-5 w-5" />
        {t("markCompleted")}
      </Button>
    </div>
  );
}
