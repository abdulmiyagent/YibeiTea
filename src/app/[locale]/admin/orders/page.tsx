"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Package,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PAID: "bg-blue-100 text-blue-800 border-blue-200",
  PREPARING: "bg-orange-100 text-orange-800 border-orange-200",
  READY: "bg-green-100 text-green-800 border-green-200",
  COMPLETED: "bg-gray-100 text-gray-800 border-gray-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const statusIcons = {
  PENDING: Clock,
  PAID: CheckCircle,
  PREPARING: ChefHat,
  READY: Package,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
};

const statusFlow = ["PENDING", "PAID", "PREPARING", "READY", "COMPLETED"] as const;

type OrderStatus = keyof typeof statusColors;

export default function AdminOrdersPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const t = useTranslations("admin.orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  // Status labels from translations
  const statusLabels: Record<string, string> = {
    PENDING: t("pending"),
    PAID: t("paid"),
    PREPARING: t("preparing"),
    READY: t("ready"),
    COMPLETED: t("completed"),
    CANCELLED: t("cancelled"),
  };

  // Format customizations JSON to readable string
  const formatCustomizations = (customizations: unknown): string | null => {
    if (!customizations || typeof customizations !== "object") return null;

    const c = customizations as Record<string, unknown>;
    const parts: string[] = [];

    if (c.sugarLevel !== undefined) {
      parts.push(`${c.sugarLevel}% ${t("sugarLevel")}`);
    }
    if (c.iceLevel) {
      parts.push(`${c.iceLevel} ${t("ice")}`);
    }
    if (c.size) {
      parts.push(`${c.size}`);
    }
    if (c.milkType) {
      parts.push(`${c.milkType}`);
    }
    if (Array.isArray(c.toppings) && c.toppings.length > 0) {
      parts.push(`+${c.toppings.join(", ")}`);
    }

    return parts.length > 0 ? parts.join(", ") : null;
  };

  // Fetch orders from database
  const {
    data: orders,
    isLoading,
    refetch,
  } = api.orders.getAll.useQuery(
    { limit: 100 },
    { enabled: authStatus === "authenticated" && session?.user?.role === "ADMIN" }
  );

  // Update status mutation
  const updateStatusMutation = api.orders.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (authStatus === "loading" || isLoading) {
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

  if (authStatus === "unauthenticated" || session?.user?.role !== "ADMIN") {
    router.push("/");
    return null;
  }

  const filteredOrders = (orders || []).filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const getNextStatus = (currentStatus: string): OrderStatus | null => {
    const currentIndex = statusFlow.indexOf(currentStatus as typeof statusFlow[number]);
    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  return (
    <div className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="heading-1">{t("title")}</h1>
            <p className="mt-2 text-muted-foreground">
              {t("manage")} ({orders?.length || 0} {t("total")})
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            {t("refresh")}
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === null ? "tea" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(null)}
            >
              {t("all") || "All"}
            </Button>
            {Object.keys(statusColors).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "tea" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {statusLabels[status]}
              </Button>
            ))}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredOrders.map((order) => {
            const statusColor = statusColors[order.status as OrderStatus];
            const StatusIcon = statusIcons[order.status as OrderStatus] || Clock;
            const nextStatus = getNextStatus(order.status);
            const pickupTime = order.pickupTime
              ? new Date(order.pickupTime).toLocaleTimeString("nl-BE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null;

            return (
              <Card
                key={order.id}
                className={cn(
                  "cursor-pointer transition-all",
                  selectedOrder === order.id && "ring-2 ring-tea-500"
                )}
                onClick={() =>
                  setSelectedOrder(selectedOrder === order.id ? null : order.id)
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {order.orderNumber}
                      </CardTitle>
                      <Badge className={statusColor}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <span className="text-lg font-bold text-tea-600">
                      {formatPrice(Number(order.total))}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Customer Info */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{order.customerName || t("guest")}</span>
                      {pickupTime && (
                        <span className="text-muted-foreground">
                          {t("pickupAt")}: {pickupTime}
                        </span>
                      )}
                    </div>

                    {/* Items */}
                    <div className="space-y-1">
                      {order.items.map((item, index) => {
                        const customizationsStr = formatCustomizations(item.customizations);
                        const productName =
                          item.product?.translations?.[0]?.name ||
                          item.product?.slug ||
                          "Product";

                        return (
                          <div key={index} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {productName}
                            </span>
                            {customizationsStr && (
                              <span className="text-muted-foreground text-xs">
                                {customizationsStr}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {order.notes && (
                      <p className="rounded bg-muted/50 p-2 text-sm italic text-muted-foreground">
                        "{order.notes}"
                      </p>
                    )}

                    {/* Actions */}
                    {selectedOrder === order.id && (
                      <div className="flex gap-2 pt-2">
                        {nextStatus && (
                          <Button
                            variant="tea"
                            size="sm"
                            className="flex-1"
                            disabled={updateStatusMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, nextStatus);
                            }}
                          >
                            {updateStatusMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {t("markAs")} {statusLabels[nextStatus]}
                          </Button>
                        )}
                        {order.status !== "COMPLETED" &&
                          order.status !== "CANCELLED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              disabled={updateStatusMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, "CANCELLED");
                              }}
                            >
                              {t("cancel")}
                            </Button>
                          )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredOrders.length === 0 && !isLoading && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              {orders?.length === 0
                ? t("noOrdersReceived")
                : t("noOrdersFilter")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
