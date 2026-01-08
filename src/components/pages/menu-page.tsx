"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import {
  Search,
  Plus,
  Leaf,
  Coffee,
} from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ProductCustomizeDialog } from "@/components/products/product-customize-dialog";

// Skeleton loader for product cards
function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <Skeleton className="h-16 w-16 flex-shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </Card>
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

export function MenuPageContent() {
  const t = useTranslations("menu");
  const locale = useLocale() as "nl" | "en";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVeganOnly, setShowVeganOnly] = useState(false);
  const [showCaffeineFree, setShowCaffeineFree] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch categories with stale-while-revalidate
  const { data: categories, isLoading: categoriesLoading } = api.categories.getAll.useQuery(
    { locale },
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  );

  // Fetch products with stale-while-revalidate and keep previous data for smooth transitions
  const { data: products, isLoading: productsLoading, isFetching } = api.products.getAll.useQuery(
    {
      locale,
      categorySlug: selectedCategory || undefined,
      onlyAvailable: true,
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      keepPreviousData: true, // Keep previous data while fetching new
    }
  );

  const isInitialLoading = categoriesLoading || (productsLoading && !products);

  // Filter products based on search and dietary filters - memoized for performance
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    const searchLower = searchQuery.toLowerCase();

    return products.filter((product) => {
      const productName = product.translations[0]?.name || "";
      const productDescription = product.translations[0]?.description || "";

      const matchesSearch =
        productName.toLowerCase().includes(searchLower) ||
        productDescription.toLowerCase().includes(searchLower);
      const matchesVegan = !showVeganOnly || product.vegan;
      const matchesCaffeine = !showCaffeineFree || !product.caffeine;

      return matchesSearch && matchesVegan && matchesCaffeine;
    });
  }, [products, searchQuery, showVeganOnly, showCaffeineFree]);

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center">
          <h1 className="heading-1">{t("title")}</h1>
          <p className="mt-4 text-muted-foreground">
            {locale === "nl"
              ? "Ontdek onze selectie van verse, handgemaakte drankjes"
              : "Discover our selection of fresh, handcrafted drinks"}
          </p>
        </div>

        {/* Sticky Filters */}
        <div className="sticky top-14 md:top-16 z-40 -mx-4 px-4 py-3 bg-white border-b border-gray-100 [&:not(:first-child)]:mt-6 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={locale === "nl" ? "Zoek drankjes..." : "Search drinks..."}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Tabs - Horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {categoriesLoading ? (
                <CategorySkeleton />
              ) : (
                <>
                  <Button
                    variant={selectedCategory === null ? "tea" : "outline"}
                    size="sm"
                    className="flex-shrink-0 transition-all"
                    onClick={() => setSelectedCategory(null)}
                  >
                    {locale === "nl" ? "Alle Drankjes" : "All Drinks"}
                  </Button>
                  {categories?.map((category) => {
                    const translation = category.translations[0];
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.slug ? "tea" : "outline"}
                        size="sm"
                        className="flex-shrink-0 transition-all"
                        onClick={() => setSelectedCategory(category.slug)}
                      >
                        {translation?.name || formatSlug(category.slug)}
                      </Button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Filter toggles */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={showVeganOnly ? "matcha" : "outline"}
                size="sm"
                onClick={() => setShowVeganOnly(!showVeganOnly)}
              >
                <Leaf className="mr-1 h-4 w-4" />
                {t("filter.vegan")}
              </Button>
              <Button
                variant={showCaffeineFree ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowCaffeineFree(!showCaffeineFree)}
              >
                <Coffee className="mr-1 h-4 w-4" />
                {t("filter.caffeineFree")}
              </Button>
            </div>
          </div>
        </div>

        {/* Initial Loading State - Skeleton Grid */}
        {isInitialLoading && (
          <div className="mt-8 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!isInitialLoading && (
          <div className={`mt-8 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-200 ${isFetching ? 'opacity-70' : 'opacity-100'}`}>
            {filteredProducts.map((product) => {
              const translation = product.translations[0];
              const categoryTranslation = product.category?.translations[0];

              return (
                <div
                  key={product.id}
                  className="block cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <Card className="product-card group overflow-hidden transition-all hover:shadow-md hover:bg-tea-50/50">
                    <div className="flex items-center gap-3 p-3">
                      {/* Compact thumbnail */}
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-tea-50 to-taro-50">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={translation?.name || product.slug}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-2xl">🧋</span>
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-tea-600 font-medium truncate">
                            {categoryTranslation?.name || (product.category?.slug && formatSlug(product.category.slug))}
                          </p>
                          {product.vegan && (
                            <Leaf className="h-3 w-3 text-matcha-500" />
                          )}
                        </div>
                        <h3 className="font-semibold text-sm mt-0.5 line-clamp-1">
                          {translation?.name || formatSlug(product.slug)}
                        </h3>
                        <span className="text-sm font-bold text-tea-600 mt-0.5 block">
                          €{Number(product.price).toFixed(2)}
                        </span>
                      </div>
                      {/* Favorite button */}
                      <FavoriteButton
                        productId={product.id}
                        className="h-8 w-8 flex-shrink-0"
                      />
                      {/* Add button */}
                      <Button
                        size="icon"
                        variant="tea"
                        className="h-9 w-9 flex-shrink-0 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {!isInitialLoading && filteredProducts.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              {locale === "nl"
                ? "Geen drankjes gevonden. Probeer andere filters."
                : "No drinks found. Try different filters."}
            </p>
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
