"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore, CartItemCustomization } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import {
  Minus,
  Plus,
  Leaf,
  Coffee,
  Check,
  ArrowLeft,
} from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import Image from "next/image";

// Format slug to display name (taro-milk-tea → Taro Milk Tea)
function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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
  // For editing existing cart items
  initialCustomizations?: CartItemCustomization;
  initialQuantity?: number;
  editMode?: boolean;
  cartItemId?: string;
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
  initialCustomizations,
  initialQuantity,
  editMode = false,
  cartItemId,
}: ProductCustomizationProps) {
  const t = useTranslations("product");
  const tMenu = useTranslations("menu");
  const locale = useLocale() as "nl" | "en";
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);

  // Local state - initialize from props if editing
  const [quantity, setQuantity] = useState(initialQuantity ?? 1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  // Filter customization groups based on product settings
  // Use === false to only filter out explicitly disabled options (not undefined)
  const filteredCustomizationGroups = useMemo(() => {
    return customizationGroups.filter((group) => {
      if (group.type === "SUGAR_LEVEL" && product.allowSugarCustomization === false) return false;
      if (group.type === "ICE_LEVEL" && product.allowIceCustomization === false) return false;
      return true;
    });
  }, [customizationGroups, product.allowSugarCustomization, product.allowIceCustomization]);

  // Only show toppings if allowed for this product (default to showing if undefined)
  const filteredToppings = useMemo(() => {
    return product.allowToppings !== false ? toppings : [];
  }, [toppings, product.allowToppings]);

  // Initialize defaults from customization groups or initial customizations (edit mode)
  useEffect(() => {
    const defaults: Record<string, string> = {};

    // If editing, use initial customizations
    if (initialCustomizations) {
      if (initialCustomizations.sugarLevel !== undefined) {
        defaults["SUGAR_LEVEL"] = String(initialCustomizations.sugarLevel);
      }
      if (initialCustomizations.iceLevel) {
        defaults["ICE_LEVEL"] = initialCustomizations.iceLevel;
      }
      if (initialCustomizations.size) {
        defaults["SIZE"] = initialCustomizations.size;
      }
      if (initialCustomizations.milkType) {
        defaults["MILK_TYPE"] = initialCustomizations.milkType;
      }
    }

    // Fill in remaining defaults from customization groups
    filteredCustomizationGroups.forEach((group) => {
      if (!defaults[group.type]) {
        const defaultValue = group.values.find((v) => v.isDefault);
        if (defaultValue) {
          defaults[group.type] = defaultValue.value;
        } else if (group.values.length > 0) {
          defaults[group.type] = group.values[0].value;
        }
      }
    });

    setSelectedOptions(defaults);

    // Initialize toppings from initial customizations
    if (initialCustomizations?.toppings && initialCustomizations.toppings.length > 0) {
      // Map topping names back to IDs
      const toppingIds = initialCustomizations.toppings
        .map((name) => {
          const topping = toppings.find(
            (t) => t.translations[0]?.name === name || t.slug === name
          );
          return topping?.id;
        })
        .filter(Boolean) as string[];
      setSelectedToppings(toppingIds);
    }
  }, [filteredCustomizationGroups, initialCustomizations, toppings]);

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

  // Handle add to cart (or update in edit mode)
  const handleAddToCart = () => {
    const toppingNames = selectedToppings
      .map((id) => filteredToppings.find((t) => t.id === id)?.translations[0]?.name || "")
      .filter(Boolean);

    // In edit mode, remove the old item first
    if (editMode && cartItemId) {
      removeItem(cartItemId);
    }

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
      // Close modal or page
      if (onClose) {
        onClose();
      } else if (variant === "page") {
        router.back();
      }
    }, 800); // Slightly faster for better UX
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

  // Modal variant: Takeaway-style clean list design
  if (variant === "modal") {
    return (
      <div className="flex flex-col bg-white">
        {/* Product Header - Compact with image */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
            <Image
              src={product.imageUrl || getCategoryPlaceholder(product.category?.slug)}
              alt={productName}
              fill
              sizes="80px"
              className="object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 line-clamp-2">{productName}</h2>
            {categoryName && (
              <p className="text-sm text-gray-500 mt-0.5">{categoryName}</p>
            )}
            <p className="text-base font-semibold text-gray-900 mt-1">
              €{Number(product.price).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Customization Options - Simple list style */}
        <div className="divide-y divide-gray-100">
          {filteredCustomizationGroups.map((group) => (
            <div key={group.id} className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {getGroupLabel(group.type)}
              </h3>
              <div className="space-y-1">
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
                      className="flex w-full items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:bg-gray-50 active:bg-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "border-orange-500 bg-orange-500"
                              : "border-gray-300"
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </div>
                        <span className="text-sm text-gray-900">{label}</span>
                      </div>
                      {hasModifier && (
                        <span className="text-sm text-gray-500">
                          + €{Number(option.priceModifier).toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Toppings */}
          {filteredToppings.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {t("customize.toppings")}
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                {locale === "nl" ? "Selecteer je extra's" : "Select your extras"}
              </p>
              <div className="space-y-1">
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
                      className="flex w-full items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:bg-gray-50 active:bg-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "border-orange-500 bg-orange-500"
                              : "border-gray-300"
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </div>
                        <span className="text-sm text-gray-900">
                          {topping.translations[0]?.name || formatSlug(topping.slug)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        + €{Number(topping.price).toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Quantity + Add Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            {/* Quantity controls */}
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className={cn(
                  "flex h-10 w-10 items-center justify-center transition-colors",
                  quantity <= 1 ? "text-gray-300" : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                )}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAddedToCart}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors",
                isAddedToCart
                  ? "bg-green-500 text-white"
                  : "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700"
              )}
            >
              {isAddedToCart ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>
                    {editMode
                      ? (locale === "nl" ? "Bijgewerkt!" : "Updated!")
                      : (locale === "nl" ? "Toegevoegd!" : "Added!")}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {editMode
                      ? (locale === "nl" ? "Bijwerken" : "Update cart")
                      : (locale === "nl" ? "Toevoegen" : "Add to cart")}
                  </span>
                  <span>•</span>
                  <span className="tabular-nums">€{totalPrice.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Page variant: Takeaway-style with image
  return (
    <div className="max-w-2xl mx-auto bg-white">
      {/* Product Header with Image */}
      <div className="relative">
        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-gray-50">
          <Image
            src={product.imageUrl || getCategoryPlaceholder(product.category?.slug)}
            alt={productName}
            fill
            sizes="(max-width: 672px) 100vw, 672px"
            className={product.imageUrl ? "object-contain" : "object-contain p-8"}
            priority
          />
        </div>

        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-3 top-3 h-10 w-10 bg-white/90 backdrop-blur hover:bg-white rounded-full shadow-sm"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Badges */}
        <div className="absolute right-3 top-3 flex flex-col gap-1">
          {product.vegan && (
            <Badge variant="matcha" className="text-xs">
              <Leaf className="mr-1 h-3 w-3" />
              Vegan
            </Badge>
          )}
          {!product.caffeine && (
            <Badge variant="secondary" className="text-xs bg-white/90">
              <Coffee className="mr-1 h-3 w-3" />
              {locale === "nl" ? "Cafeïnevrij" : "Caffeine-free"}
            </Badge>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {categoryName && (
              <p className="text-sm text-gray-500 mb-1">{categoryName}</p>
            )}
            <h2 className="text-xl font-semibold text-gray-900">{productName}</h2>
            {productDescription && (
              <p className="text-sm text-gray-600 mt-1">{productDescription}</p>
            )}
            {product.calories && (
              <p className="text-sm text-gray-500 mt-1">
                {product.calories} {tMenu("calories")}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xl font-semibold text-gray-900">
              €{Number(product.price).toFixed(2)}
            </span>
            <FavoriteButton
              productId={product.id}
              size="default"
              variant="outline"
              className="h-9 w-9"
            />
          </div>
        </div>
      </div>

      {/* Customization Options - Simple list style */}
      <div className="divide-y divide-gray-100">
        {filteredCustomizationGroups.map((group) => (
          <div key={group.id} className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              {getGroupLabel(group.type)}
            </h3>
            <div className="space-y-1">
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
                    className="flex w-full items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "border-orange-500 bg-orange-500"
                            : "border-gray-300"
                        )}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                      <span className="text-sm text-gray-900">{label}</span>
                    </div>
                    {hasModifier && (
                      <span className="text-sm text-gray-500">
                        + €{Number(option.priceModifier).toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Toppings */}
        {filteredToppings.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {t("customize.toppings")}
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              {locale === "nl" ? "Selecteer je extra's" : "Select your extras"}
            </p>
            <div className="space-y-1">
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
                    className="flex w-full items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "border-orange-500 bg-orange-500"
                            : "border-gray-300"
                        )}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                      <span className="text-sm text-gray-900">
                        {topping.translations[0]?.name || formatSlug(topping.slug)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      + €{Number(topping.price).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer: Quantity + Add Button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          {/* Quantity controls */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className={cn(
                "flex h-11 w-11 items-center justify-center transition-colors",
                quantity <= 1 ? "text-gray-300" : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
              )}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-base font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-11 w-11 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddedToCart}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-base font-semibold transition-colors",
              isAddedToCart
                ? "bg-green-500 text-white"
                : "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700"
            )}
          >
            {isAddedToCart ? (
              <>
                <Check className="h-5 w-5" />
                <span>{locale === "nl" ? "Toegevoegd!" : "Added!"}</span>
              </>
            ) : (
              <>
                <span>{locale === "nl" ? "Toevoegen" : "Add to cart"}</span>
                <span>•</span>
                <span className="tabular-nums">€{totalPrice.toFixed(2)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
