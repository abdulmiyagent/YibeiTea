"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import {
  Search,
  Plus,
  Leaf,
  Coffee,
  RotateCcw,
  X,
} from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ProductCustomizeDialog } from "@/components/products/product-customize-dialog";
import { cn } from "@/lib/utils";

// Skeleton loader for product cards - compact layout
function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="p-2 space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for category buttons
function CategorySkeleton() {
  return (
    <div className="flex gap-2">
      <Skeleton className="h-8 w-24 rounded-md" />
      <Skeleton className="h-8 w-20 rounded-md" />
      <Skeleton className="h-8 w-28 rounded-md" />
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  );
}

interface Product {
  id: string;
  slug: string;
  price: number | string | { toString(): string };
  imageUrl: string | null;
  vegan: boolean;
  caffeine: boolean;
  calories: number | null;
  allowSugarCustomization: boolean;
  allowIceCustomization: boolean;
  allowToppings: boolean;
  translations: Array<{ name: string; description?: string | null }>;
  category?: {
    slug: string;
    translations: Array<{ name: string }>;
  } | null;
}

// Format slug to display name (brown-sugar → Brown Sugar)
function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Recent orders storage key
const RECENT_ORDERS_KEY = "yibei-recent-orders";

interface RecentOrderItem {
  productId: string;
  name: string;
  imageUrl?: string;
  price: number;
  customizations?: {
    sugarLevel?: number;
    iceLevel?: string;
    toppings?: string[];
  };
  orderedAt: number;
}

// Get recent orders from localStorage
function getRecentOrders(): RecentOrderItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_ORDERS_KEY);
    if (!stored) return [];
    const orders = JSON.parse(stored) as RecentOrderItem[];
    // Keep only last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return orders.filter((o) => o.orderedAt > thirtyDaysAgo).slice(0, 5);
  } catch {
    return [];
  }
}

export function MenuPageContent() {
  const t = useTranslations("menu");
  const locale = useLocale() as "nl" | "en";
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVeganOnly, setShowVeganOnly] = useState(false);
  const [showCaffeineFree, setShowCaffeineFree] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Load recent orders on mount
  useEffect(() => {
    setRecentOrders(getRecentOrders());
  }, []);

  // Toggle category selection (multi-select with OR logic)
  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug) // Deselect
        : [...prev, slug] // Add to selection
    );
  };

  // Fetch categories with stale-while-revalidate
  const { data: categories, isLoading: categoriesLoading } = api.categories.getAll.useQuery(
    { locale },
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  );

  // Fetch ALL products (no category filter in API, filter client-side for OR logic)
  const { data: products, isLoading: productsLoading, isFetching } = api.products.getAll.useQuery(
    {
      locale,
      onlyAvailable: true,
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      keepPreviousData: true, // Keep previous data while fetching new
    }
  );

  // Pre-fetch shared data for popup (customizations and toppings) - makes popup instant
  api.customizations.getAll.useQuery(
    { locale },
    { staleTime: 10 * 60 * 1000 } // 10 minutes - rarely changes
  );
  api.toppings.getAll.useQuery(
    { locale, onlyAvailable: true },
    { staleTime: 10 * 60 * 1000 } // 10 minutes - rarely changes
  );

  const isInitialLoading = categoriesLoading || (productsLoading && !products);

  // Filter products: Categories use OR logic, Vegan/Caffeine use AND logic
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    const searchLower = searchQuery.toLowerCase();

    return products.filter((product) => {
      const productName = product.translations[0]?.name || "";
      const productDescription = product.translations[0]?.description || "";
      const categoryName = product.category?.translations[0]?.name || "";
      const productSlug = product.slug || "";

      // Search filter - search in name, description, category, and slug
      const matchesSearch =
        !searchLower ||
        productName.toLowerCase().includes(searchLower) ||
        productDescription.toLowerCase().includes(searchLower) ||
        categoryName.toLowerCase().includes(searchLower) ||
        productSlug.toLowerCase().includes(searchLower);

      // Category filter: OR logic (if any category selected, product must be in one of them)
      const matchesCategory =
        selectedCategories.length === 0 || // No filter = show all
        selectedCategories.includes(product.category?.slug || "");

      // Dietary filters: AND logic (both must match if enabled)
      const matchesVegan = !showVeganOnly || product.vegan;
      const matchesCaffeine = !showCaffeineFree || !product.caffeine;

      return matchesSearch && matchesCategory && matchesVegan && matchesCaffeine;
    });
  }, [products, searchQuery, selectedCategories, showVeganOnly, showCaffeineFree]);

  // Check if any filters are active
  const hasActiveFilters = selectedCategories.length > 0 || showVeganOnly || showCaffeineFree || searchQuery;

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setShowVeganOnly(false);
    setShowCaffeineFree(false);
    setSearchQuery("");
  };

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Header - Clean, minimal */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-tea-900 md:text-4xl">
            {t("title")}
          </h1>
        </div>

        {/* Sticky Search & Filters - Simplified */}
        <div className="sticky top-14 md:top-16 z-40 -mx-4 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
          {/* Search + Filter Toggle Row */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder={locale === "nl" ? "Zoek..." : "Search..."}
                className="pl-10 h-10 rounded-full border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant={showFilters ? "tea" : "outline"}
              size="sm"
              className="h-10 px-4 rounded-full shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? (locale === "nl" ? "Sluiten" : "Close") : (locale === "nl" ? "Filters" : "Filters")}
              {hasActiveFilters && !showFilters && (
                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-tea-100 text-xs font-medium text-tea-700">
                  {selectedCategories.length + (showVeganOnly ? 1 : 0) + (showCaffeineFree ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                {categoriesLoading ? (
                  <CategorySkeleton />
                ) : (
                  <>
                    <button
                      className={cn(
                        "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                        selectedCategories.length === 0
                          ? "bg-tea-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                      onClick={() => setSelectedCategories([])}
                    >
                      {locale === "nl" ? "Alles" : "All"}
                    </button>
                    {categories?.map((category) => {
                      const translation = category.translations[0];
                      const isSelected = selectedCategories.includes(category.slug);
                      return (
                        <button
                          key={category.id}
                          className={cn(
                            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                            isSelected
                              ? "bg-tea-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                          onClick={() => toggleCategory(category.slug)}
                        >
                          {translation?.name || formatSlug(category.slug)}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Dietary Filters */}
              <div className="flex gap-2">
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    showVeganOnly
                      ? "bg-matcha-100 text-matcha-700 ring-1 ring-matcha-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                  onClick={() => setShowVeganOnly(!showVeganOnly)}
                >
                  <Leaf className="h-3.5 w-3.5" />
                  {t("filter.vegan")}
                </button>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    showCaffeineFree
                      ? "bg-gray-200 text-gray-800 ring-1 ring-gray-400"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                  onClick={() => setShowCaffeineFree(!showCaffeineFree)}
                >
                  <Coffee className="h-3.5 w-3.5" />
                  {t("filter.caffeineFree")}
                </button>
                {hasActiveFilters && (
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={clearFilters}
                  >
                    <X className="h-3.5 w-3.5" />
                    {locale === "nl" ? "Wissen" : "Clear"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Reorder Section - Show if user has recent orders */}
        {recentOrders.length > 0 && !searchQuery && selectedCategories.length === 0 && (
          <div className="mt-6 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="h-4 w-4 text-tea-600" />
              <h2 className="text-sm font-semibold text-gray-700">
                {locale === "nl" ? "Bestel opnieuw" : "Order again"}
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {recentOrders.map((order, idx) => (
                <button
                  key={`${order.productId}-${idx}`}
                  className="flex-shrink-0 flex items-center gap-3 p-3 rounded-2xl bg-cream-50 border border-cream-200 hover:border-tea-300 hover:bg-cream-100 transition-all min-w-[200px]"
                  onClick={() => {
                    const product = products?.find((p) => p.id === order.productId);
                    if (product) setSelectedProduct(product);
                  }}
                >
                  <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                    {order.imageUrl ? (
                      <img src={order.imageUrl} alt={order.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl">🧋</span>
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{order.name}</p>
                    <p className="text-xs text-gray-500">
                      {order.customizations?.sugarLevel !== undefined && `${order.customizations.sugarLevel}%`}
                      {order.customizations?.iceLevel && ` · ${order.customizations.iceLevel}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Initial Loading State */}
        {isInitialLoading && (
          <div className="mt-4 grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Products Grid - Compact cards optimized for mobile */}
        {!isInitialLoading && (
          <div className={cn(
            "mt-4 grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 transition-opacity duration-200",
            isFetching && "opacity-70"
          )}>
            {filteredProducts.map((product) => {
              const translation = product.translations[0];

              return (
                <div
                  key={product.id}
                  className="group cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  {/* Compact card with 4:5 aspect ratio image */}
                  <div className="overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-200 hover:shadow-md hover:border-tea-200 hover:-translate-y-0.5">
                    {/* Product Image - shorter aspect ratio for compact display */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-cream-50 via-white to-tea-50/30">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={translation?.name || product.slug}
                          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-tea-50 to-cream-100">
                          <span className="text-4xl transition-transform duration-300 group-hover:scale-110">🧋</span>
                        </div>
                      )}

                      {/* Floating badges - smaller */}
                      {product.vegan && (
                        <div className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-matcha-500 text-white shadow-sm">
                          <Leaf className="h-3 w-3" />
                        </div>
                      )}

                      {/* Favorite button - smaller */}
                      <div className="absolute top-1.5 right-1.5">
                        <FavoriteButton
                          productId={product.id}
                          className="h-7 w-7 bg-white/90 backdrop-blur-sm shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Product Info - more compact */}
                    <div className="p-2">
                      {/* Name - single line with truncate */}
                      <h3 className="font-medium text-gray-900 text-sm leading-snug truncate">
                        {translation?.name || formatSlug(product.slug)}
                      </h3>

                      {/* Price + Add button row */}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm font-bold text-tea-600">
                          €{Number(product.price).toFixed(2)}
                        </span>
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-tea-600 text-white shadow-sm transition-all hover:bg-tea-700 active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                          aria-label={locale === "nl" ? "Toevoegen" : "Add"}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isInitialLoading && filteredProducts.length === 0 && (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">
              {locale === "nl" ? "Geen drankjes gevonden" : "No drinks found"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {locale === "nl"
                ? "Probeer andere zoektermen of filters"
                : "Try different search terms or filters"}
            </p>
            {hasActiveFilters && (
              <button
                className="mt-4 text-sm font-medium text-tea-600 hover:text-tea-700"
                onClick={clearFilters}
              >
                {locale === "nl" ? "Alle filters wissen" : "Clear all filters"}
              </button>
            )}
          </div>
        )}

        {/* Product Customize Dialog */}
        {selectedProduct && (
          <ProductCustomizeDialog
            product={selectedProduct}
            open={!!selectedProduct}
            onOpenChange={(open) => !open && setSelectedProduct(null)}
          />
        )}
      </div>
    </div>
  );
}
