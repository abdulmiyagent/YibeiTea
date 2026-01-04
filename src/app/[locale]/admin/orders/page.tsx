"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sample orders data
const ordersData = [
  {
    id: "YBT-XYZ789",
    orderNumber: "YBT-XYZ789",
    customer: "Emma Vermeer",
    email: "emma@email.be",
    phone: "0471 23 45 67",
    items: [
      { name: "Classic Taro", quantity: 1, customizations: "50% suiker, normaal ijs" },
      { name: "Brown Sugar Boba", quantity: 2, customizations: "100% suiker, extra ijs" },
    ],
    total: 16.5,
    status: "PREPARING",
    pickupTime: "14:30",
    createdAt: "2024-01-15T14:15:00",
    notes: "Geen extra toppings a.u.b.",
  },
  {
    id: "YBT-ABC123",
    orderNumber: "YBT-ABC123",
    customer: "Thomas De Smet",
    email: "thomas@email.be",
    phone: "0478 98 76 54",
    items: [
      { name: "Matcha Latte", quantity: 1, customizations: "25% suiker, geen ijs" },
    ],
    total: 5.5,
    status: "READY",
    pickupTime: "14:15",
    createdAt: "2024-01-15T14:00:00",
    notes: null,
  },
  {
    id: "YBT-DEF456",
    orderNumber: "YBT-DEF456",
    customer: "Lisa Martens",
    email: "lisa@email.be",
    phone: "0495 12 34 56",
    items: [
      { name: "Peach Garden Mojito", quantity: 1, customizations: null },
      { name: "Green Apple Ice Tea", quantity: 1, customizations: "0% suiker" },
    ],
    total: 11.5,
    status: "PENDING",
    pickupTime: "14:45",
    createdAt: "2024-01-15T14:20:00",
    notes: null,
  },
  {
    id: "YBT-GHI789",
    orderNumber: "YBT-GHI789",
    customer: "Jan Peeters",
    email: "jan@email.be",
    phone: "0468 11 22 33",
    items: [
      { name: "Hazelnut Nutella Coffee", quantity: 2, customizations: "75% suiker" },
    ],
    total: 11.0,
    status: "PAID",
    pickupTime: "15:00",
    createdAt: "2024-01-15T14:25:00",
    notes: "Extra hazelnoottoppings indien mogelijk",
  },
];

const statusConfig = {
  PENDING: {
    label: "In afwachting",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  PAID: {
    label: "Betaald",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
  },
  PREPARING: {
    label: "In bereiding",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: ChefHat,
  },
  READY: {
    label: "Klaar",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: Package,
  },
  COMPLETED: {
    label: "Afgehaald",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Geannuleerd",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

const statusFlow = ["PENDING", "PAID", "PREPARING", "READY", "COMPLETED"];

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState(ordersData);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    router.push("/");
    return null;
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  return (
    <div className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-1">Bestellingen</h1>
          <p className="mt-2 text-muted-foreground">
            Beheer en volg alle bestellingen
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Zoek op bestelnummer of klant..."
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
              Alle
            </Button>
            {Object.entries(statusConfig).map(([status, config]) => (
              <Button
                key={status}
                variant={statusFilter === status ? "tea" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {config.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredOrders.map((order) => {
            const config = statusConfig[order.status as keyof typeof statusConfig];
            const StatusIcon = config.icon;
            const nextStatus = getNextStatus(order.status);

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
                      <Badge className={config.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>
                    <span className="text-lg font-bold text-tea-600">
                      €{order.total.toFixed(2)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Customer Info */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{order.customer}</span>
                      <span className="text-muted-foreground">
                        Afhalen: {order.pickupTime}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          {item.customizations && (
                            <span className="text-muted-foreground">
                              {item.customizations}
                            </span>
                          )}
                        </div>
                      ))}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, nextStatus);
                            }}
                          >
                            Markeer als{" "}
                            {
                              statusConfig[nextStatus as keyof typeof statusConfig]
                                .label
                            }
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Would open details modal
                          }}
                        >
                          Details
                        </Button>
                        {order.status !== "COMPLETED" &&
                          order.status !== "CANCELLED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, "CANCELLED");
                              }}
                            >
                              Annuleren
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

        {filteredOrders.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Geen bestellingen gevonden met deze filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
