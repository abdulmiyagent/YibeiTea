"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { api } from "@/lib/trpc";
import {
  ArrowLeft,
  Minus,
  Plus,
  Heart,
  Leaf,
  Coffee,
  Loader2,
  ShoppingCart,
  Check,
  AlertCircle,
} from "lucide-react";

const SUGAR_LEVELS = [0, 25, 50, 75, 100] as const;
const ICE_LEVELS = ["none", "less", "normal", "extra"] as const;

type SugarLevel = (typeof SUGAR_LEVELS)[number];
type IceLevel = (typeof ICE_LEVELS)[number];

export default function ProductDetailPage() {
  const t = useTranslations("product");
  const tMenu = useTranslations("menu");
  const locale = useLocale() as "nl" | "en";
  const params = useParams();
  const slug = params.slug as string;
  const addItem = useCartStore((state) => state.addItem);

  // Customization state
  const [quantity, setQuantity] = useState(1);
  const [sugarLevel, setSugarLevel] = useState<SugarLevel>(100);
  const [iceLevel, setIceLevel] = useState<IceLevel>("normal");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  // Fetch product
  const { data: product, isLoading: productLoading } = api.products.getBySlug.useQuery({
    slug,
    locale,
  });

  // Fetch toppings
  const { data: toppings, isLoading: toppingsLoading } = api.toppings.getAll.useQuery({
    locale,
    onlyAvailable: true,
  });

  const isLoading = productLoading || toppingsLoading;

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!product) return 0;
    const basePrice = Number(product.price);
    const toppingsPrice = selectedToppings.reduce((sum, toppingId) => {
      const topping = toppings?.find((t) => t.id === toppingId);
      return sum + (topping ? Number(topping.price) : 0);
    }, 0);
    return (basePrice + toppingsPrice) * quantity;
  }, [product, selectedToppings, toppings, quantity]);

  const handleToppingToggle = (toppingId: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId)
        ? prev.filter((id) => id !== toppingId)
        : [...prev, toppingId]
    );
  };

  const handleAddToCart = () => {
    if (!product) return;
    const translation = product.translations[0];

    // Get topping names for display
    const toppingNames = selectedToppings.map((id) => {
      const topping = toppings?.find((t) => t.id === id);
      return topping?.translations[0]?.name || "";
    }).filter(Boolean);

    addItem({
      productId: product.id,
      name: translation?.name || product.slug,
      price: totalPrice / quantity,
      quantity,
      imageUrl: product.imageUrl || undefined,
      customizations: {
        sugarLevel,
        iceLevel,
        toppings: toppingNames,
      },
    });

    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="section-padding">
        <div className="container-custom flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="section-padding">
        <div className="container-custom text-center min-h-[60vh] flex flex-col items-center justify-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {locale === "nl" ? "Product niet gevonden" : "Product not found"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {locale === "nl"
              ? "Het product dat je zoekt bestaat niet of is niet meer beschikbaar."
              : "The product you're looking for doesn't exist or is no longer available."}
          </p>
          <Link href="/menu">
            <Button variant="tea">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {locale === "nl" ? "Terug naar menu" : "Back to menu"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const translation = product.translations[0];
  const categoryTranslation = product.category?.translations[0];

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/menu"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-tea-600 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === "nl" ? "Terug naar menu" : "Back to menu"}
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-tea-50 to-taro-50">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={translation?.name || product.slug}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-9xl">🧋</span>
                </div>
              )}
            </div>
            {/* Badges */}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {product.vegan && (
                <Badge variant="matcha" className="text-sm">
                  <Leaf className="mr-1 h-4 w-4" />
                  Vegan
                </Badge>
              )}
              {!product.caffeine && (
                <Badge variant="secondary" className="text-sm">
                  {locale === "nl" ? "Cafeïnevrij" : "Caffeine-free"}
                </Badge>
              )}
            </div>
            {/* Favorite button */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-4 top-4 h-10 w-10 bg-white/80 backdrop-blur"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            {/* Category */}
            <p className="text-sm font-medium text-tea-600 mb-2">
              {categoryTranslation?.name || product.category?.slug}
            </p>

            {/* Title & Price */}
            <h1 className="text-3xl font-bold mb-2">
              {translation?.name || product.slug}
            </h1>
            <p className="text-2xl font-bold text-tea-600 mb-4">
              €{Number(product.price).toFixed(2)}
            </p>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              {translation?.description}
            </p>

            {/* Nutritional Info */}
            {product.calories && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <span>{product.calories} {tMenu("calories")}</span>
                {product.caffeine && (
                  <span className="flex items-center">
                    <Coffee className="mr-1 h-4 w-4" />
                    {locale === "nl" ? "Bevat cafeïne" : "Contains caffeine"}
                  </span>
                )}
              </div>
            )}

            <Separator className="my-6" />

            {/* Customization Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">{t("customize.title")}</h2>

              {/* Sugar Level */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  {t("customize.sugarLevel")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUGAR_LEVELS.map((level) => (
                    <Button
                      key={level}
                      variant={sugarLevel === level ? "tea" : "outline"}
                      size="sm"
                      onClick={() => setSugarLevel(level)}
                      className="min-w-[80px]"
                    >
                      {t(`sugarLevels.${level}`)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Ice Level */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  {t("customize.iceLevel")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICE_LEVELS.map((level) => (
                    <Button
                      key={level}
                      variant={iceLevel === level ? "tea" : "outline"}
                      size="sm"
                      onClick={() => setIceLevel(level)}
                      className="min-w-[80px]"
                    >
                      {t(`iceLevels.${level}`)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Toppings */}
              {toppings && toppings.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    {t("customize.toppings")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {toppings.map((topping) => {
                      const toppingTranslation = topping.translations[0];
                      const isSelected = selectedToppings.includes(topping.id);
                      return (
                        <Button
                          key={topping.id}
                          variant={isSelected ? "tea" : "outline"}
                          size="sm"
                          onClick={() => handleToppingToggle(topping.id)}
                          className="justify-between h-auto py-2 px-3"
                        >
                          <span className="flex items-center">
                            {isSelected && <Check className="mr-2 h-4 w-4" />}
                            {toppingTranslation?.name || topping.slug}
                          </span>
                          <span className="text-xs opacity-70">
                            +€{Number(topping.price).toFixed(2)}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Quantity & Add to Cart */}
            <div className="mt-auto space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {locale === "nl" ? "Aantal" : "Quantity"}
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Total Price */}
              <div className="flex items-center justify-between text-lg">
                <span className="font-medium">
                  {locale === "nl" ? "Totaal" : "Total"}
                </span>
                <span className="text-2xl font-bold text-tea-600">
                  €{totalPrice.toFixed(2)}
                </span>
              </div>

              {/* Add to Cart Button */}
              <Button
                variant="tea"
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={isAddedToCart}
              >
                {isAddedToCart ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    {locale === "nl" ? "Toegevoegd!" : "Added!"}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {tMenu("addToCart")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
