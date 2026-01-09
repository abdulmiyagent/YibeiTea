"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn, getDisplayName, formatSlugToName } from "@/lib/utils";
import Image from "next/image";
import type { MenuProduct, Category, Topping, CustomizationOption } from "@/lib/server-data";

// Get category placeholder image URL based on category slug
function getCategoryPlaceholder(categorySlug: string | undefined): string {
  const validCategories = [
    "brown-sugar",
    "milk-tea",
    "cream-cheese",
    "iced-coffee",
    "hot-coffee",
    "ice-tea",
    "mojito",
    "kids-star",
    "latte-special",
    "frappucchino",
  ];

  if (categorySlug && validCategories.includes(categorySlug)) {
    return `/images/categories/${categorySlug}.svg`;
  }
  return "/images/categories/placeholder.svg";
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

interface MenuPageClientProps {
  products: MenuProduct[];
  categories: Category[];
  toppings: Topping[];
  customizations: CustomizationOption[];
  locale: "nl" | "en";
}

export function MenuPageClient({
  products,
  categories,
  locale,
}: MenuPageClientProps) {
  const t = useTranslations("menu");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVeganOnly, setShowVeganOnly] = useState(false);
  const [showCaffeineFree, setShowCaffeineFree] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(null);
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
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  };

  // Filter products: Categories use OR logic, Vegan/Caffeine use AND logic
  const filteredProducts = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();

    return products.filter((product) => {
      const productName = product.translations[0]?.name || "";
      const productDescription = product.translations[0]?.description || "";
      const categoryName = product.category?.translations[0]?.name || "";
      const productSlug = product.slug || "";

      // Search filter
      const matchesSearch =
        !searchLower ||
        productName.toLowerCase().includes(searchLower) ||
        productDescription.toLowerCase().includes(searchLower) ||
        categoryName.toLowerCase().includes(searchLower) ||
        productSlug.toLowerCase().includes(searchLower);

      // Category filter: OR logic
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category?.slug || "");

      // Dietary filters: AND logic
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-bordeaux-800 md:text-4xl">
            {t("title")}
          </h1>
        </div>

        {/* Sticky Search & Filters */}
        <div className="sticky top-14 md:top-16 z-40 -mx-4 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
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
                {categories.map((category) => {
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
                      {translation?.name || formatSlugToName(category.slug)}
                    </button>
                  );
                })}
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

        {/* Quick Reorder Section */}
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
                    const product = products.find((p) => p.id === order.productId);
                    if (product) setSelectedProduct(product);
                  }}
                >
                  <div className="relative h-12 w-12 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                    {order.imageUrl ? (
                      <Image src={order.imageUrl} alt={order.name} fill className="object-cover" sizes="48px" />
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

        {/* Products Grid - No loading state needed, data is server-fetched */}
        <div className="mt-4 grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredProducts.map((product) => {
            const translation = product.translations[0];

            return (
              <div
                key={product.id}
                className="group cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="overflow-hidden rounded-lg border border-gray-100 bg-white transition-all duration-200 hover:shadow-md hover:border-tea-200 active:scale-[0.98]">
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-cream-50 via-white to-tea-50/30">
                    <Image
                      src={product.imageUrl || getCategoryPlaceholder(product.category?.slug)}
                      alt={getDisplayName(translation?.name, product.slug)}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
                      className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Vegan badge */}
                    {product.vegan && (
                      <div className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-matcha-500 text-white shadow-sm">
                        <Leaf className="h-2.5 w-2.5" />
                      </div>
                    )}

                    {/* Favorite button */}
                    <div className="absolute top-1 right-1">
                      <FavoriteButton
                        productId={product.id}
                        className="h-6 w-6 bg-white/90 backdrop-blur-sm shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-1.5">
                    <h3 className="font-medium text-gray-900 text-xs leading-tight truncate">
                      {translation?.name || formatSlugToName(product.slug)}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-bold text-tea-600">
                        €{Number(product.price).toFixed(2)}
                      </span>
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-tea-600 text-white shadow-sm transition-all hover:bg-tea-700 active:scale-95"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        aria-label={locale === "nl" ? "Toevoegen" : "Add"}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
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
