"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ChevronRight,
  AlertTriangle,
  Package,
  Loader2,
  Timer,
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

const POLLING_INTERVAL = 15000; // 15 seconds
const CANCEL_WINDOW_MINUTES = 30;

export function ActiveOrdersWidget() {
  const t = useTranslations("admin.activeOrders");
  const tOrders = useTranslations("admin.orders");

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<ActiveOrder | null>(null);
  const [cancelReason, setCancelReason] = useState<CancellationReason>("BUSY");
  const [customReason, setCustomReason] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastOrderCountRef = useRef<number>(0);
  const lastOrderIdRef = useRef<string | null>(null);

  // Fetch active orders
  const {
    data: orders,
    isLoading,
    refetch,
  } = api.orders.getActiveOrders.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: true,
  });

  // Fetch order count for new order detection
  const { data: orderCount } = api.orders.getActiveOrderCount.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: true,
  });

  // Mutations
  const updateStatusMutation = api.orders.updateStatus.useMutation({
    onSuccess: () => refetch(),
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
      setSelectedOrders(new Set());
    },
  });

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.wav");
    audioRef.current.volume = 0.7;

    // Check notification permission
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

    // Check if there's a new order
    if (
      lastOrderCountRef.current > 0 &&
      count > lastOrderCountRef.current &&
      latestOrderId !== lastOrderIdRef.current
    ) {
      // New order detected!
      if (soundEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }

      // Show browser notification
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
    const elapsed = (now - created) / 1000 / 60; // minutes
    return Math.max(0, CANCEL_WINDOW_MINUTES - elapsed);
  };

  // Check if order can be cancelled
  const canCancel = (order: ActiveOrder): boolean => {
    return getCancelTimeRemaining(order.createdAt) > 0;
  };

  // Check if pickup time is approaching
  const isPickupApproaching = (pickupTime: Date | null): boolean => {
    if (!pickupTime) return false;
    const pickup = new Date(pickupTime).getTime();
    const now = Date.now();
    const diff = (pickup - now) / 1000 / 60; // minutes
    return diff <= 5 && diff > -15; // Within 5 min before to 15 min after
  };

  // Check if pickup time is overdue
  const isPickupOverdue = (pickupTime: Date | null): boolean => {
    if (!pickupTime) return false;
    const pickup = new Date(pickupTime).getTime();
    return Date.now() > pickup;
  };

  // Handle status update
  const handleStatusUpdate = (orderId: string, newStatus: "PREPARING" | "READY" | "COMPLETED") => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  // Handle cancel
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

  // Handle bulk actions
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

  const statusLabels: Record<string, string> = {
    PAID: tOrders("paid"),
    PREPARING: tOrders("preparing"),
  };

  const cancellationReasons: { value: CancellationReason; label: string }[] = [
    { value: "BUSY", label: t("cancelReasons.busy") },
    { value: "OUT_OF_STOCK", label: t("cancelReasons.outOfStock") },
    { value: "CUSTOMER_REQUEST", label: t("cancelReasons.customerRequest") },
    { value: "OTHER", label: t("cancelReasons.other") },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-tea-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-tea-600" />
                {t("title")}
                {orders && orders.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-tea-100 text-tea-700">
                    {orders.length}
                  </Badge>
                )}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {/* Sound toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? t("soundOn") : t("soundOff")}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-tea-600" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>

              {/* Notification toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={notificationsEnabled ? () => setNotificationsEnabled(false) : requestNotificationPermission}
                title={notificationsEnabled ? t("notificationsOn") : t("notificationsOff")}
              >
                {notificationsEnabled ? (
                  <Bell className="h-4 w-4 text-tea-600" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>

              {/* Refresh button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>

              {/* View all link */}
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm">
                  {t("viewAll")}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(!orders || orders.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="mb-3 h-12 w-12 text-green-500" />
              <p className="text-lg font-medium text-green-700">{t("noActiveOrders")}</p>
              <p className="text-sm text-muted-foreground">{t("allCaughtUp")}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bulk actions */}
              {selectedOrders.size > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-tea-50 p-3">
                  <span className="text-sm font-medium">
                    {t("selectedOrders", { count: selectedOrders.size })}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrders(new Set())}
                    >
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
              )}

              {/* New orders (PAID) */}
              {paidOrders.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-yellow-700">
                    <Clock className="h-4 w-4" />
                    {t("newOrders")} ({paidOrders.length})
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {paidOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        statusLabel={statusLabels[order.status]}
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
                        t={t}
                        tOrders={tOrders}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* In progress (PREPARING) */}
              {preparingOrders.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-orange-700">
                    <ChefHat className="h-4 w-4" />
                    {t("inProgress")} ({preparingOrders.length})
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {preparingOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        statusLabel={statusLabels[order.status]}
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
                        t={t}
                        tOrders={tOrders}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
    </>
  );
}

// Order Card Component
interface OrderCardProps {
  order: ActiveOrder;
  statusLabel: string;
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
  t: ReturnType<typeof useTranslations>;
  tOrders: ReturnType<typeof useTranslations>;
}

function OrderCard({
  order,
  statusLabel,
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
  t,
  tOrders,
}: OrderCardProps) {
  const pickupTime = order.pickupTime
    ? new Date(order.pickupTime).toLocaleTimeString("nl-BE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const statusColor = order.status === "PAID"
    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
    : "bg-orange-100 text-orange-800 border-orange-200";

  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-white p-4 transition-all",
        isSelected && "border-tea-500 bg-tea-50",
        isPickupOverdue && "border-red-300 bg-red-50",
        isPickupApproaching && !isPickupOverdue && "border-amber-300 bg-amber-50"
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-gray-300 text-tea-600 focus:ring-tea-500"
          />
          <div>
            <span className="font-bold">{order.orderNumber}</span>
            <Badge className={cn("ml-2", statusColor)}>{statusLabel}</Badge>
          </div>
        </div>
        <span className="text-lg font-bold text-tea-600">
          {formatPrice(order.total)}
        </span>
      </div>

      {/* Customer & Pickup */}
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium">{order.customerName || tOrders("guest")}</span>
        {pickupTime && (
          <span
            className={cn(
              "flex items-center gap-1",
              isPickupOverdue && "font-bold text-red-600",
              isPickupApproaching && !isPickupOverdue && "font-bold text-amber-600"
            )}
          >
            <Clock className="h-3 w-3" />
            {t("pickupAt")} {pickupTime}
            {isPickupOverdue && (
              <AlertTriangle className="ml-1 h-3 w-3" />
            )}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="mb-3 space-y-1 text-sm">
        {order.items.map((item) => {
          const customStr = formatCustomizations(item.customizations);
          return (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.quantity}x {item.productName}
              </span>
              {customStr && (
                <span className="text-xs text-muted-foreground">{customStr}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-3 rounded bg-muted/50 p-2 text-xs italic text-muted-foreground">
          "{order.notes}"
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onStart && (
          <Button
            size="sm"
            variant="tea"
            className="flex-1"
            onClick={onStart}
            disabled={isUpdating}
          >
            <ChefHat className="mr-1 h-4 w-4" />
            {t("startPreparing")}
          </Button>
        )}
        {onReady && (
          <Button
            size="sm"
            variant="tea"
            className="flex-1"
            onClick={onReady}
            disabled={isUpdating}
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            {t("markReady")}
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onCancel}
            disabled={isUpdating}
          >
            <XCircle className="mr-1 h-4 w-4" />
            <Timer className="mr-1 h-3 w-3" />
            {Math.floor(cancelTimeRemaining)}m
          </Button>
        )}
      </div>
    </div>
  );
}
