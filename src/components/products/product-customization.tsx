"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import {
  Minus,
  Plus,
  Leaf,
  Coffee,
  ShoppingCart,
  Check,
  ArrowLeft,
} from "lucide-react";

// =============================================================================
// TYPES - Shared across modal and page
// =============================================================================

export interface ProductData {
  id: string;
  slug: string;
  price: number | string;
  imageUrl: string | null;
  vegan: boolean;
  caffeine: boolean;
  calories: number | null;
  translations: Array<{
    name: string;
    description: string | null;
  }>;
  category: {
    slug: string;
    translations: Array<{
      name: string;
    }>;
  } | null;
}

export interface CustomizationGroup {
  id: string;
  type: string;
  values: Array<{
    id: string;
    value: string;
    priceModifier: number | string;
    isDefault: boolean;
    translations: Array<{
      label: string;
    }>;
  }>;
}

export interface ToppingData {
  id: string;
  slug: string;
  price: number | string;
  translations: Array<{
    name: string;
  }>;
}

interface ProductCustomizationProps {
  product: ProductData;
  customizationGroups: CustomizationGroup[];
  toppings: ToppingData[];
  variant: "modal" | "page";
  onClose?: () => void;
}

// =============================================================================
// MAIN COMPONENT - Pure UI, receives all data as props
// =============================================================================

export function ProductCustomization({
  product,
  customizationGroups,
  toppings,
  variant,
  onClose,
}: ProductCustomizationProps) {
  const t = useTranslations("product");
  const tMenu = useTranslations("menu");
  const locale = useLocale() as "nl" | "en";
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  // Local state
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  // Initialize defaults from customization groups
  useEffect(() => {
    const defaults: Record<string, string> = {};
    customizationGroups.forEach((group) => {
      const defaultValue = group.values.find((v) => v.isDefault);
      if (defaultValue) {
        defaults[group.type] = defaultValue.value;
      } else if (group.values.length > 0) {
        defaults[group.type] = group.values[0].value;
      }
    });
    setSelectedOptions(defaults);
  }, [customizationGroups]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    let price = Number(product.price);

    // Add customization price modifiers
    customizationGroups.forEach((group) => {
      const selectedValue = selectedOptions[group.type];
      const option = group.values.find((v) => v.value === selectedValue);
      if (option) {
        price += Number(option.priceModifier);
      }
    });

    // Add toppings
    selectedToppings.forEach((id) => {
      const topping = toppings.find((t) => t.id === id);
      if (topping) price += Number(topping.price);
    });

    return price * quantity;
  }, [product.price, customizationGroups, selectedOptions, toppings, selectedToppings, quantity]);

  // Handle add to cart
  const handleAddToCart = () => {
    const toppingNames = selectedToppings
      .map((id) => toppings.find((t) => t.id === id)?.translations[0]?.name || "")
      .filter(Boolean);

    addItem({
      productId: product.id,
      name: product.translations[0]?.name || product.slug,
      price: totalPrice / quantity,
      quantity,
      imageUrl: product.imageUrl || undefined,
      customizations: {
        sugarLevel: selectedOptions["SUGAR_LEVEL"]
          ? parseInt(selectedOptions["SUGAR_LEVEL"])
          : undefined,
        iceLevel: selectedOptions["ICE_LEVEL"],
        toppings: toppingNames,
      },
    });

    setIsAddedToCart(true);
    setTimeout(() => {
      setIsAddedToCart(false);
      // Close modal via router back, or redirect for page
      if (variant === "modal") {
        router.back();
      } else if (onClose) {
        onClose();
      }
    }, 1000);
  };

  // Handle back navigation
  const handleBack = () => {
    if (variant === "modal") {
      router.back();
    } else {
      router.push(`/${locale}/menu`);
    }
  };

  // Get translation key for group type
  const getGroupLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      SUGAR_LEVEL: "sugarLevel",
      ICE_LEVEL: "iceLevel",
      SIZE: "size",
      MILK_TYPE: "milkType",
    };
    return t(`customize.${typeMap[type] || type.toLowerCase()}`);
  };

  const productName = product.translations[0]?.name || product.slug;
  const productDescription = product.translations[0]?.description;
  const categoryName = product.category?.translations[0]?.name || product.category?.slug;

  return (
    <div className={variant === "page" ? "grid gap-8 lg:grid-cols-2" : "grid gap-0 sm:grid-cols-2"}>
      {/* Product Image */}
      <div className={`relative overflow-hidden bg-gradient-to-br from-tea-50 to-taro-50 ${
        variant === "page" ? "aspect-square rounded-2xl" : "aspect-square sm:aspect-auto sm:h-full"
      }`}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center">
            <span className="text-8xl">🧋</span>
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
              <Coffee className="mr-1 h-3 w-3" />
              {locale === "nl" ? "Cafeïnevrij" : "Caffeine-free"}
            </Badge>
          )}
        </div>

        {/* Back button for page variant */}
        {variant === "page" && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-3 top-3 mt-12 h-10 w-10 bg-white/80 backdrop-blur hover:bg-white"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Customization Options */}
      <div className={`flex flex-col gap-4 ${
        variant === "page"
          ? "py-4"
          : "max-h-[60vh] overflow-y-auto p-6 sm:max-h-[70vh]"
      }`}>
        {/* Header */}
        <div>
          {categoryName && (
            <p className="text-xs font-medium text-tea-600 mb-1">{categoryName}</p>
          )}
          <h2 className={variant === "page" ? "text-3xl font-bold" : "text-2xl font-bold"}>
            {productName}
          </h2>
          <p className="text-xl font-bold text-tea-600 mt-1">
            €{Number(product.price).toFixed(2)}
          </p>
          {productDescription && (
            <p className={`text-muted-foreground mt-2 ${variant === "page" ? "" : "line-clamp-2 text-sm"}`}>
              {productDescription}
            </p>
          )}
          {variant === "page" && product.calories && (
            <p className="text-sm text-muted-foreground mt-1">
              {product.calories} {tMenu("calories")}
            </p>
          )}
        </div>

        {/* Dynamic Customization Groups */}
        {customizationGroups.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t("customize.title")}</h3>

              {customizationGroups.map((group) => (
                <div key={group.id}>
                  <label className="mb-2 block text-sm font-medium">
                    {getGroupLabel(group.type)}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {group.values.map((option) => {
                      const label = option.translations[0]?.label || option.value;
                      const isSelected = selectedOptions[group.type] === option.value;

                      return (
                        <Button
                          key={option.id}
                          variant={isSelected ? "tea" : "outline"}
                          size="sm"
                          onClick={() =>
                            setSelectedOptions({
                              ...selectedOptions,
                              [group.type]: option.value,
                            })
                          }
                          className="h-auto py-1.5"
                        >
                          {label}
                          {Number(option.priceModifier) > 0 && (
                            <span className="ml-1 text-xs opacity-70">
                              +€{Number(option.priceModifier).toFixed(2)}
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Toppings */}
        {toppings.length > 0 && (
          <>
            <Separator />
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t("customize.toppings")}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {toppings.map((topping) => {
                  const isSelected = selectedToppings.includes(topping.id);
                  return (
                    <Button
                      key={topping.id}
                      variant={isSelected ? "tea" : "outline"}
                      size="sm"
                      onClick={() =>
                        setSelectedToppings((prev) =>
                          prev.includes(topping.id)
                            ? prev.filter((id) => id !== topping.id)
                            : [...prev, topping.id]
                        )
                      }
                      className="h-auto justify-between py-1.5"
                    >
                      <span className="flex items-center">
                        {isSelected && <Check className="mr-1 h-3 w-3" />}
                        {topping.translations[0]?.name || topping.slug}
                      </span>
                      <span className="text-xs opacity-70">
                        +€{Number(topping.price).toFixed(2)}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Quantity & Total */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {locale === "nl" ? "Aantal" : "Quantity"}
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">
              {locale === "nl" ? "Totaal" : "Total"}
            </span>
            <span className="text-2xl font-bold text-tea-600">
              €{totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Add to Cart */}
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
  );
}
