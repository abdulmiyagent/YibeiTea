"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cart-store";
import { ProductQuickCustomize } from "@/components/products/product-quick-customize";
import { api } from "@/lib/trpc";
import {
  Search,
  Plus,
  Heart,
  Leaf,
  Coffee,
  Loader2,
} from "lucide-react";

export default function MenuPage() {
  const t = useTranslations("menu");
  const locale = useLocale() as "nl" | "en";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVeganOnly, setShowVeganOnly] = useState(false);
  const [showCaffeineFree, setShowCaffeineFree] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

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

  const handleAddToCart = (product: NonNullable<typeof products>[0]) => {
    const translation = product.translations[0];
    addItem({
      productId: product.id,
      name: translation?.name || product.slug,
      price: Number(product.price),
      quantity: 1,
      customizations: {
        sugarLevel: 100,
        iceLevel: "normal",
      },
    });
  };

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

        {/* Filters */}
        <div className="mt-8 space-y-4">
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

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "tea" : "outline"}
              size="sm"
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

        {/* Loading State */}
        {isLoading && (
          <div className="mt-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const translation = product.translations[0];
              const categoryTranslation = product.category?.translations[0];

              return (
                <Card key={product.id} className="product-card group overflow-hidden">
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-tea-50 to-taro-50">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={translation?.name || product.slug}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-7xl transition-transform group-hover:scale-110">
                          🧋
                        </span>
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute left-3 top-3 flex flex-col gap-1">
                      {product.vegan && (
                        <Badge variant="matcha" className="text-xs">
                          <Leaf className="mr-1 h-3 w-3" />
                          Vegan
                        </Badge>
                      )}
                      {!product.caffeine && (
                        <Badge variant="secondary" className="text-xs">
                          {locale === "nl" ? "Cafeïnevrij" : "Caffeine-free"}
                        </Badge>
                      )}
                    </div>
                    {/* Quick add button */}
                    <Button
                      size="icon"
                      variant="tea"
                      className="absolute bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleAddToCart(product)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    {/* Favorite button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-3 top-3 h-8 w-8 bg-white/80 backdrop-blur"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-tea-600 font-medium mb-1">
                          {categoryTranslation?.name || product.category?.slug}
                        </p>
                        <h3 className="font-semibold">{translation?.name || product.slug}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {translation?.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-tea-600">
                        €{Number(product.price).toFixed(2)}
                      </span>
                      {product.calories && (
                        <span className="text-xs text-muted-foreground">
                          {product.calories} {t("calories")}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        className="flex-1"
                        variant="tea"
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        {t("addToCart")}
                      </Button>
                      <ProductQuickCustomize product={product} />
                    </div>
                  </CardContent>
                </Card>
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
      </div>
    </div>
  );
}
