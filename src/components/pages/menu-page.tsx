"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/trpc";
import {
  Search,
  Plus,
  Leaf,
  Coffee,
  Loader2,
} from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ProductCustomizeDialog } from "@/components/products/product-customize-dialog";

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

export function MenuPageContent() {
  const t = useTranslations("menu");
  const locale = useLocale() as "nl" | "en";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVeganOnly, setShowVeganOnly] = useState(false);
  const [showCaffeineFree, setShowCaffeineFree] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = api.categories.getAll.useQuery({
    locale,
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = api.products.getAll.useQuery({
    locale,
    categorySlug: selectedCategory || undefined,
    onlyAvailable: true,
  });

  const isLoading = categoriesLoading || productsLoading;

  // Filter products based on search and dietary filters
  const filteredProducts = products?.filter((product) => {
    const productName = product.translations[0]?.name || "";
    const productDescription = product.translations[0]?.description || "";

    const matchesSearch =
      productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      productDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVegan = !showVeganOnly || product.vegan;
    const matchesCaffeine = !showCaffeineFree || !product.caffeine;

    return matchesSearch && matchesVegan && matchesCaffeine;
  }) || [];

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
        <div className="sticky top-16 z-40 -mx-4 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-transparent [&:not(:first-child)]:mt-6 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]">
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
              <Button
                variant={selectedCategory === null ? "tea" : "outline"}
                size="sm"
                className="flex-shrink-0"
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
                    className="flex-shrink-0"
                    onClick={() => setSelectedCategory(category.slug)}
                  >
                    {translation?.name || category.slug}
                  </Button>
                );
              })}
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

        {/* Loading State */}
        {isLoading && (
          <div className="mt-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && (
          <div className="mt-8 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                          <p className="text-xs text-tea-600 font-medium">
                            {categoryTranslation?.name || product.category?.slug}
                          </p>
                          {product.vegan && (
                            <Leaf className="h-3 w-3 text-matcha-500" />
                          )}
                        </div>
                        <h3 className="font-semibold text-sm mt-0.5 line-clamp-1">
                          {translation?.name || product.slug}
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

        {!isLoading && filteredProducts.length === 0 && (
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
