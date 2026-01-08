"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import {
  Minus,
  Plus,
  Leaf,
  Coffee,
  ShoppingCart,
  Check,
  ArrowLeft,
  Heart,
} from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";

// Format slug to display name (taro-milk-tea → Taro Milk Tea)
function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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
  allowSugarCustomization: boolean;
  allowIceCustomization: boolean;
  allowToppings: boolean;
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

  // Filter customization groups based on product settings
  const filteredCustomizationGroups = useMemo(() => {
    return customizationGroups.filter((group) => {
      if (group.type === "SUGAR_LEVEL" && !product.allowSugarCustomization) return false;
      if (group.type === "ICE_LEVEL" && !product.allowIceCustomization) return false;
      return true;
    });
  }, [customizationGroups, product.allowSugarCustomization, product.allowIceCustomization]);

  // Only show toppings if allowed for this product
  const filteredToppings = useMemo(() => {
    return product.allowToppings ? toppings : [];
  }, [toppings, product.allowToppings]);

  // Initialize defaults from customization groups
  useEffect(() => {
    const defaults: Record<string, string> = {};
    filteredCustomizationGroups.forEach((group) => {
      const defaultValue = group.values.find((v) => v.isDefault);
      if (defaultValue) {
        defaults[group.type] = defaultValue.value;
      } else if (group.values.length > 0) {
        defaults[group.type] = group.values[0].value;
      }
    });
    setSelectedOptions(defaults);
  }, [filteredCustomizationGroups]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    let price = Number(product.price);

    // Add customization price modifiers
    filteredCustomizationGroups.forEach((group) => {
      const selectedValue = selectedOptions[group.type];
      const option = group.values.find((v) => v.value === selectedValue);
      if (option) {
        price += Number(option.priceModifier);
      }
    });

    // Add toppings
    selectedToppings.forEach((id) => {
      const topping = filteredToppings.find((t) => t.id === id);
      if (topping) price += Number(topping.price);
    });

    return price * quantity;
  }, [product.price, filteredCustomizationGroups, selectedOptions, filteredToppings, selectedToppings, quantity]);

  // Handle add to cart
  const handleAddToCart = () => {
    const toppingNames = selectedToppings
      .map((id) => filteredToppings.find((t) => t.id === id)?.translations[0]?.name || "")
      .filter(Boolean);

    addItem({
      productId: product.id,
      name: product.translations[0]?.name || formatSlug(product.slug),
      price: totalPrice / quantity,
      quantity,
      imageUrl: product.imageUrl || undefined,
      customizations: {
        sugarLevel: selectedOptions["SUGAR_LEVEL"]
          ? parseInt(selectedOptions["SUGAR_LEVEL"])
          : undefined,
        iceLevel: selectedOptions["ICE_LEVEL"],
        size: selectedOptions["SIZE"],
        milkType: selectedOptions["MILK_TYPE"],
        toppings: toppingNames.length > 0 ? toppingNames : undefined,
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

  const productName = product.translations[0]?.name || formatSlug(product.slug);
  const productDescription = product.translations[0]?.description;
  const categoryName = product.category?.translations[0]?.name || (product.category?.slug && formatSlug(product.category.slug));

  // Modal variant: ultra-compact floating card
  // Minimal, clean, non-intrusive
  if (variant === "modal") {
    return (
      <div className="flex flex-col p-3">
        {/* Compact Header */}
        <div className="flex gap-2.5 pr-5">
          {/* Tiny product image */}
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-tea-50 to-taro-50">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={productName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-base">🧋</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-1 flex-col justify-center min-w-0">
            <h2 className="text-sm font-semibold leading-tight truncate">{productName}</h2>
            <span className="text-xs font-semibold text-tea-600">
              €{Number(product.price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Customization Options - ultra compact */}
        {filteredCustomizationGroups.length > 0 && (
          <div className="mt-2.5 space-y-2">
            {filteredCustomizationGroups.map((group) => (
              <div key={group.id}>
                <label className="mb-1 block text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                  {getGroupLabel(group.type)}
                </label>
                <div className="flex flex-wrap gap-1">
                  {group.values.map((option) => {
                    const label = option.translations[0]?.label || option.value;
                    const isSelected = selectedOptions[group.type] === option.value;

                    return (
                      <button
                        key={option.id}
                        onClick={() =>
                          setSelectedOptions({
                            ...selectedOptions,
                            [group.type]: option.value,
                          })
                        }
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium transition-all",
                          isSelected
                            ? "bg-tea-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toppings - ultra compact */}
        {filteredToppings.length > 0 && (
          <div className="mt-2">
            <label className="mb-1 block text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              {t("customize.toppings")}
            </label>
            <div className="flex flex-wrap gap-1">
              {filteredToppings.map((topping) => {
                const isSelected = selectedToppings.includes(topping.id);
                return (
                  <button
                    key={topping.id}
                    onClick={() =>
                      setSelectedToppings((prev) =>
                        prev.includes(topping.id)
                          ? prev.filter((id) => id !== topping.id)
                          : [...prev, topping.id]
                      )
                    }
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium transition-all flex items-center gap-0.5",
                      isSelected
                        ? "bg-tea-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {isSelected && <Check className="h-2 w-2" />}
                    {topping.translations[0]?.name || formatSlug(topping.slug)}
                    <span className="opacity-60 text-[10px]">+€{Number(topping.price).toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer: Quantity + Add Button */}
        <div className="mt-2.5 flex items-center gap-2">
          {/* Quantity controls */}
          <div className="flex items-center rounded-full bg-gray-100">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full transition-all",
                quantity <= 1 ? "text-gray-300" : "text-gray-600 hover:bg-white"
              )}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-4 text-center text-xs font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-600 transition-all hover:bg-white"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddedToCart}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition-all",
              isAddedToCart
                ? "bg-green-500 text-white"
                : "bg-tea-500 text-white hover:bg-tea-600"
            )}
          >
            {isAddedToCart ? (
              <>
                <Check className="h-3 w-3" />
                <span>{locale === "nl" ? "Toegevoegd!" : "Added!"}</span>
              </>
            ) : (
              <>
                <span>{locale === "nl" ? "Toevoegen" : "Add"}</span>
                <span>€{totalPrice.toFixed(2)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Page variant: full layout with large image
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Product Image - large for page view */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-tea-50 to-taro-50">
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

        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-3 top-3 mt-12 h-10 w-10 bg-white/80 backdrop-blur hover:bg-white"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Customization Options */}
      <div className="flex flex-col gap-6 py-4">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              {categoryName && (
                <p className="text-xs font-medium text-tea-600 mb-1">{categoryName}</p>
              )}
              <h2 className="text-3xl font-bold">{productName}</h2>
              <p className="text-xl font-bold text-tea-600 mt-1">
                €{Number(product.price).toFixed(2)}
              </p>
            </div>
            <FavoriteButton
              productId={product.id}
              size="default"
              variant="outline"
              className="h-10 w-10"
            />
          </div>
          {productDescription && (
            <p className="text-muted-foreground mt-2">{productDescription}</p>
          )}
          {product.calories && (
            <p className="text-sm text-muted-foreground mt-1">
              {product.calories} {tMenu("calories")}
            </p>
          )}
        </div>

        {/* Dynamic Customization Groups */}
        {filteredCustomizationGroups.length > 0 && (
          <div className="space-y-5 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold">{t("customize.title")}</h3>

            {filteredCustomizationGroups.map((group) => (
              <div key={group.id}>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {getGroupLabel(group.type)}
                </label>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((option) => {
                    const label = option.translations[0]?.label || option.value;
                    const isSelected = selectedOptions[group.type] === option.value;
                    const hasModifier = Number(option.priceModifier) > 0;

                    return (
                      <button
                        key={option.id}
                        onClick={() =>
                          setSelectedOptions({
                            ...selectedOptions,
                            [group.type]: option.value,
                          })
                        }
                        className={cn(
                          "rounded-full px-4 py-2 text-sm font-medium transition-all",
                          "border",
                          isSelected
                            ? "border-tea-300 bg-tea-500 text-white shadow-md"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                        )}
                      >
                        {label}
                        {hasModifier && (
                          <span className={cn(
                            "ml-1 text-xs",
                            isSelected ? "text-white/80" : "text-gray-400"
                          )}>
                            +€{Number(option.priceModifier).toFixed(2)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toppings */}
        {filteredToppings.length > 0 && (
          <div className="border-t border-gray-100 pt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t("customize.toppings")}
            </label>
            <div className="flex flex-wrap gap-2">
              {filteredToppings.map((topping) => {
                const isSelected = selectedToppings.includes(topping.id);
                return (
                  <button
                    key={topping.id}
                    onClick={() =>
                      setSelectedToppings((prev) =>
                        prev.includes(topping.id)
                          ? prev.filter((id) => id !== topping.id)
                          : [...prev, topping.id]
                      )
                    }
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-all",
                      "border flex items-center gap-2",
                      isSelected
                        ? "border-tea-300 bg-tea-500 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    {topping.translations[0]?.name || formatSlug(topping.slug)}
                    <span className={cn(
                      "text-xs",
                      isSelected ? "text-white/80" : "text-gray-400"
                    )}>
                      +€{Number(topping.price).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity & Total */}
        <div className="space-y-4 border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              {locale === "nl" ? "Aantal" : "Quantity"}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                  quantity <= 1
                    ? "border-gray-200 text-gray-300"
                    : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                )}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-lg font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-all hover:border-gray-400 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
              </button>
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
        <button
          onClick={handleAddToCart}
          disabled={isAddedToCart}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold transition-all",
            "shadow-lg",
            isAddedToCart
              ? "bg-green-500 text-white shadow-green-500/25"
              : "bg-tea-500 text-white shadow-tea-500/30 hover:bg-tea-600 hover:shadow-xl hover:shadow-tea-500/40"
          )}
        >
          {isAddedToCart ? (
            <>
              <Check className="h-5 w-5" />
              {locale === "nl" ? "Toegevoegd!" : "Added!"}
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              {tMenu("addToCart")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
