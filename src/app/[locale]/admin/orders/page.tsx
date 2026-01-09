"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  X,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Local translations for orders page (independent of website locale)
const ordersPageTranslations = {
  nl: {
    searchPlaceholder: "Zoek klant of bestelnummer...",
    active: "actief",
    of: "van",
    waitingForOrders: "Wachtend op nieuwe bestellingen...",
    noResultsFor: "Geen resultaten voor",
    tryOtherTerm: "Probeer een andere zoekterm",
    clearSearch: "Wis zoekopdracht",
    noNewOrders: "Geen nieuwe bestellingen",
    noOrdersPreparing: "Geen bestellingen in bereiding",
    noOrdersReady: "Geen bestellingen klaar",
    note: "Opmerking",
    startPreparing: "Start bereiding",
    readyForPickup: "Klaar voor afhalen",
    pickedUp: "Afgehaald",
    soundOn: "Geluid aan",
    soundOff: "Geluid uit",
    refresh: "Vernieuwen",
    minutesLate: "m te laat",
    paid: "Betaald",
    preparing: "In bereiding",
    ready: "Klaar",
    guest: "Gast",
    noOrdersReceived: "Nog geen bestellingen ontvangen.",
  },
  ne: {
    searchPlaceholder: "ग्राहक वा अर्डर नम्बर खोज्नुहोस्...",
    active: "सक्रिय",
    of: "मध्ये",
    waitingForOrders: "नयाँ अर्डरको पर्खाइमा...",
    noResultsFor: "को लागि कुनै परिणाम छैन",
    tryOtherTerm: "अर्को खोज शब्द प्रयोग गर्नुहोस्",
    clearSearch: "खोज हटाउनुहोस्",
    noNewOrders: "कुनै नयाँ अर्डर छैन",
    noOrdersPreparing: "तयारीमा कुनै अर्डर छैन",
    noOrdersReady: "कुनै अर्डर तयार छैन",
    note: "टिप्पणी",
    startPreparing: "तयारी सुरु",
    readyForPickup: "लिन तयार",
    pickedUp: "लिइयो",
    soundOn: "आवाज अन",
    soundOff: "आवाज अफ",
    refresh: "रिफ्रेश",
    minutesLate: " मिनेट ढिलो",
    paid: "भुक्तानी भयो",
    preparing: "तयारी हुँदैछ",
    ready: "तयार",
    guest: "अतिथि",
    noOrdersReceived: "अहिलेसम्म कुनै अर्डर प्राप्त भएको छैन।",
  },
};

type LocalLang = "nl" | "ne";

const ORDERS_LANG_KEY = "yibei-orders-page-lang";

function useOrdersPageLang() {
  const [lang, setLang] = useState<LocalLang>("nl");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(ORDERS_LANG_KEY) as LocalLang | null;
    if (stored && (stored === "nl" || stored === "ne")) {
      setLang(stored);
    }
    setIsLoaded(true);
  }, []);

  const setLanguage = useCallback((newLang: LocalLang) => {
    setLang(newLang);
    localStorage.setItem(ORDERS_LANG_KEY, newLang);
  }, []);

  const toggleLang = useCallback(() => {
    const newLang = lang === "nl" ? "ne" : "nl";
    setLanguage(newLang);
  }, [lang, setLanguage]);

  const tLocal = useCallback(
    (key: keyof typeof ordersPageTranslations.nl) => {
      return ordersPageTranslations[lang][key];
    },
    [lang]
  );

  return { lang, setLanguage, toggleLang, tLocal, isLoaded };
}

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
  const { lang, toggleLang, tLocal } = useOrdersPageLang();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [pickupSearch, setPickupSearch] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastOrderCountRef = useRef<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      <div className="flex min-h-[60vh] items-center justify-center">
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

  // Filter orders by search query
  const filterOrders = (orderList: Order[], query: string) => {
    if (!query.trim()) return orderList;
    const q = query.toLowerCase().trim();
    return orderList.filter(order =>
      order.orderNumber.toLowerCase().includes(q) ||
      (order.customerName?.toLowerCase().includes(q))
    );
  };

  // Categorize orders
  const paidOrders = filterOrders((orders || []).filter(o => o.status === "PAID"), searchQuery);
  const preparingOrders = filterOrders((orders || []).filter(o => o.status === "PREPARING"), searchQuery);
  // Ready orders use pickupSearch if active, otherwise global search
  const allReadyOrders = (orders || []).filter(o => o.status === "READY");
  const readyOrders = pickupSearch
    ? filterOrders(allReadyOrders, pickupSearch)
    : filterOrders(allReadyOrders, searchQuery);

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
  const totalUnfiltered = (orders || []).filter(o => ["PAID", "PREPARING", "READY"].includes(o.status)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-tea-50/50 via-cream-100/30 to-matcha-50/50">
      {/* Toolbar */}
      <div className="mx-auto max-w-[1800px] px-4 pt-4 pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tea-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={tLocal("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-white/80 border-tea-200 focus:border-tea-400 focus:ring-tea-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tea-400 hover:text-tea-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {totalUnfiltered > 0 && (
              <span className="text-sm text-tea-600 mr-2">
                {searchQuery ? `${totalActive} ${tLocal("of")} ${totalUnfiltered}` : `${totalActive} ${tLocal("active")}`}
              </span>
            )}
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLang}
              className={cn(
                "text-tea-700 hover:bg-tea-100 gap-1.5 px-2",
                lang === "ne" && "bg-orange-100 text-orange-700 hover:bg-orange-200"
              )}
              title={lang === "nl" ? "Switch to Nepali" : "Nederlands"}
            >
              <Languages className="h-4 w-4" />
              <span className="text-xs font-medium">{lang === "nl" ? "NL" : "नेपाली"}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                "text-tea-700 hover:bg-tea-100",
                soundEnabled && "bg-tea-100"
              )}
              title={soundEnabled ? tLocal("soundOff") : tLocal("soundOn")}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
              className="text-tea-700 hover:bg-tea-100"
              title={tLocal("refresh")}
            >
              <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <main className="mx-auto max-w-[1800px] p-4">
        {totalActive === 0 && !searchQuery ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-matcha-200/50 blur-2xl" />
              <CheckCircle className="relative h-24 w-24 text-matcha-500" />
            </div>
            <p className="text-2xl font-bold text-matcha-700">{tLocal("noOrdersReceived")}</p>
            <p className="mt-2 text-matcha-600/70">{tLocal("waitingForOrders")}</p>
          </div>
        ) : totalActive === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="h-16 w-16 text-tea-300 mb-4" />
            <p className="text-xl font-bold text-tea-700">{tLocal("noResultsFor")} "{searchQuery}"</p>
            <p className="mt-2 text-tea-500">{tLocal("tryOtherTerm")}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSearchQuery("")}
            >
              {tLocal("clearSearch")}
            </Button>
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
                  searchQuery={searchQuery}
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
                  searchQuery={searchQuery}
                  t={t}
                />
              ))}
            </KanbanColumn>

            {/* Column 3: Ready - with dedicated pickup search */}
            <ReadyColumn
              title={tLocal("ready")}
              count={sortedReady.length}
              totalCount={allReadyOrders.length}
              pickupSearch={pickupSearch}
              onPickupSearchChange={setPickupSearch}
              isEmpty={sortedReady.length === 0}
              emptyText={tLocal("noOrdersReady")}
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
                  searchQuery={pickupSearch || searchQuery}
                  t={t}
                />
              ))}
            </ReadyColumn>
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
      <div className="flex-1 p-3 space-y-3 min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto">
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

// Ready Column with dedicated pickup search
interface ReadyColumnProps {
  title: string;
  count: number;
  totalCount: number;
  pickupSearch: string;
  onPickupSearchChange: (value: string) => void;
  isEmpty: boolean;
  emptyText: string;
  children: React.ReactNode;
}

function ReadyColumn({
  title,
  count,
  totalCount,
  pickupSearch,
  onPickupSearchChange,
  isEmpty,
  emptyText,
  children,
}: ReadyColumnProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchToggle = () => {
    if (isSearchOpen) {
      onPickupSearchChange("");
      setIsSearchOpen(false);
    } else {
      setIsSearchOpen(true);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl bg-white/70 backdrop-blur-sm border shadow-soft overflow-hidden border-matcha-200/50">
      {/* Column Header */}
      <div className="bg-gradient-to-r from-matcha-500 to-matcha-400 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-bold text-lg">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Search toggle button */}
            <button
              onClick={handleSearchToggle}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                isSearchOpen || pickupSearch
                  ? "bg-white text-matcha-600"
                  : "bg-matcha-600 hover:bg-matcha-700"
              )}
              title="Zoek afhaler"
            >
              {isSearchOpen || pickupSearch ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
            {count > 0 && !isSearchOpen && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold bg-matcha-600">
                {count}
              </span>
            )}
          </div>
        </div>

        {/* Expanded search input */}
        {isSearchOpen && (
          <div className="mt-3 relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Zoek naam of bestelnr..."
              value={pickupSearch}
              onChange={(e) => onPickupSearchChange(e.target.value)}
              className="w-full rounded-lg bg-white/90 px-3 py-2 text-sm text-matcha-900 placeholder-matcha-400 focus:outline-none focus:ring-2 focus:ring-white"
            />
            {pickupSearch && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-matcha-600">
                {count}/{totalCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Column Content */}
      <div className="flex-1 p-3 space-y-3 min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="opacity-30 mb-2 text-matcha-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Highlight matching text
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
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
  searchQuery: string;
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
  searchQuery,
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

  const isHighlighted = searchQuery && (
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={cn(
        "group relative rounded-xl border-2 bg-white p-4 transition-all hover:shadow-soft-lg",
        isOverdue && "border-bordeaux-400 bg-bordeaux-50/50 animate-gentle-pulse",
        isUrgent && !isOverdue && "border-amber-400 bg-amber-50/50",
        !isUrgent && !isOverdue && "border-tea-100",
        isHighlighted && !isUrgent && !isOverdue && "border-tea-400 ring-2 ring-tea-200"
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
          <span className="text-xl font-bold text-tea-900">
            <HighlightMatch text={order.orderNumber} query={searchQuery} />
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-tea-600">
              <HighlightMatch text={order.customerName || t("guest")} query={searchQuery} />
            </span>
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
