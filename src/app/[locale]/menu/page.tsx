"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cart-store";
import {
  Search,
  Filter,
  Plus,
  Heart,
  Leaf,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Product data (would come from database)
const products = [
  // Bubble Tea
  {
    id: "1",
    slug: "classic-taro",
    name: "Classic Taro Milk Tea",
    nameEn: "Classic Taro Milk Tea",
    description: "Romige taro melkthee met verse tapioca parels",
    descriptionEn: "Creamy taro milk tea with fresh tapioca pearls",
    price: 5.5,
    category: "BUBBLE_TEA",
    vegan: false,
    caffeine: true,
    calories: 280,
  },
  {
    id: "2",
    slug: "brown-sugar-boba",
    name: "Brown Sugar Boba",
    nameEn: "Brown Sugar Boba",
    description: "Klassieke melkthee met bruine suiker siroop en boba",
    descriptionEn: "Classic milk tea with brown sugar syrup and boba",
    price: 5.5,
    category: "BUBBLE_TEA",
    vegan: false,
    caffeine: true,
    calories: 320,
  },
  {
    id: "3",
    slug: "passion-fruit-tea",
    name: "Passievrucht Thee",
    nameEn: "Passion Fruit Tea",
    description: "Verfrissende thee met passievrucht en fruit jellies",
    descriptionEn: "Refreshing tea with passion fruit and fruit jellies",
    price: 5.5,
    category: "BUBBLE_TEA",
    vegan: true,
    caffeine: true,
    calories: 180,
  },
  // Milk Tea
  {
    id: "4",
    slug: "matcha-latte",
    name: "Matcha Latte",
    nameEn: "Matcha Latte",
    description: "Premium Japanse matcha met romige melk",
    descriptionEn: "Premium Japanese matcha with creamy milk",
    price: 5.5,
    category: "MILK_TEA",
    vegan: false,
    caffeine: true,
    calories: 220,
  },
  {
    id: "5",
    slug: "thai-milk-tea",
    name: "Thai Milk Tea",
    nameEn: "Thai Milk Tea",
    description: "Authentieke Thaise thee met gecondenseerde melk",
    descriptionEn: "Authentic Thai tea with condensed milk",
    price: 5.5,
    category: "MILK_TEA",
    vegan: false,
    caffeine: true,
    calories: 260,
  },
  // Iced Tea
  {
    id: "6",
    slug: "green-apple-ice",
    name: "Green Apple Iced Tea",
    nameEn: "Green Apple Iced Tea",
    description: "Verfrissende groene appel thee met ijs",
    descriptionEn: "Refreshing green apple tea with ice",
    price: 5.5,
    category: "ICED_TEA",
    vegan: true,
    caffeine: true,
    calories: 150,
  },
  {
    id: "7",
    slug: "strawberry-ice",
    name: "Strawberry Iced Tea",
    nameEn: "Strawberry Iced Tea",
    description: "Zoete aardbeien thee met verse aardbeien stukjes",
    descriptionEn: "Sweet strawberry tea with fresh strawberry pieces",
    price: 5.5,
    category: "ICED_TEA",
    vegan: true,
    caffeine: true,
    calories: 160,
  },
  // Iced Coffee
  {
    id: "8",
    slug: "caramel-vanilla",
    name: "Caramel Vanilla Coffee",
    nameEn: "Caramel Vanilla Coffee",
    description: "Ijskoffie met karamel en vanille smaak",
    descriptionEn: "Iced coffee with caramel and vanilla flavor",
    price: 5.5,
    category: "ICED_COFFEE",
    vegan: false,
    caffeine: true,
    calories: 280,
  },
  {
    id: "9",
    slug: "hazelnut-nutella",
    name: "Hazelnut Nutella Coffee",
    nameEn: "Hazelnut Nutella Coffee",
    description: "Romige ijskoffie met hazelnoot en Nutella",
    descriptionEn: "Creamy iced coffee with hazelnut and Nutella",
    price: 5.5,
    category: "ICED_COFFEE",
    vegan: false,
    caffeine: true,
    calories: 340,
  },
  // Mojitos
  {
    id: "10",
    slug: "blue-ocean",
    name: "Blue Ocean Mojito",
    nameEn: "Blue Ocean Mojito",
    description: "Verfrissende blauwe cocktail met munt en limoen",
    descriptionEn: "Refreshing blue cocktail with mint and lime",
    price: 6.0,
    category: "MOJITO",
    vegan: true,
    caffeine: false,
    calories: 120,
  },
  {
    id: "11",
    slug: "peach-garden",
    name: "Peach Garden Mojito",
    nameEn: "Peach Garden Mojito",
    description: "Zoete perzik mojito met verse munt",
    descriptionEn: "Sweet peach mojito with fresh mint",
    price: 6.0,
    category: "MOJITO",
    vegan: true,
    caffeine: false,
    calories: 130,
  },
  {
    id: "12",
    slug: "tokyo-kiwi",
    name: "Tokyo Kiwi Mojito",
    nameEn: "Tokyo Kiwi Mojito",
    description: "Exotische kiwi mojito met Japanse twist",
    descriptionEn: "Exotic kiwi mojito with Japanese twist",
    price: 6.0,
    category: "MOJITO",
    vegan: true,
    caffeine: false,
    calories: 125,
  },
];

const categories = [
  { id: "ALL", label: "Alle Drankjes", labelEn: "All Drinks" },
  { id: "BUBBLE_TEA", label: "Bubble Tea", labelEn: "Bubble Tea" },
  { id: "MILK_TEA", label: "Milk Tea", labelEn: "Milk Tea" },
  { id: "ICED_TEA", label: "Iced Tea", labelEn: "Iced Tea" },
  { id: "ICED_COFFEE", label: "Iced Coffee", labelEn: "Iced Coffee" },
  { id: "MOJITO", label: "Mojitos", labelEn: "Mojitos" },
];

export default function MenuPage() {
  const t = useTranslations("menu");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showVeganOnly, setShowVeganOnly] = useState(false);
  const [showCaffeineFree, setShowCaffeineFree] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "ALL" || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVegan = !showVeganOnly || product.vegan;
    const matchesCaffeine = !showCaffeineFree || !product.caffeine;

    return matchesCategory && matchesSearch && matchesVegan && matchesCaffeine;
  });

  const handleAddToCart = (product: typeof products[0]) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
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
            Ontdek onze selectie van verse, handgemaakte drankjes
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Zoek drankjes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "tea" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </Button>
            ))}
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

        {/* Products Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="product-card group overflow-hidden">
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-tea-50 to-taro-50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl transition-transform group-hover:scale-110">
                    🧋
                  </span>
                </div>
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
                      Cafeïnevrij
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
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-tea-600">
                    €{product.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {product.calories} {t("calories")}
                  </span>
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
                  <Link href={`/menu/${product.slug}`}>
                    <Button variant="outline" size="sm">
                      {t("customize")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Geen drankjes gevonden. Probeer andere filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
