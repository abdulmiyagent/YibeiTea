"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  ShoppingCart,
  Check,
  ArrowLeft,
  Heart,
} from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CameraCapture } from "@/components/products/camera-capture";

// =============================================================================
// HAPTIC FEEDBACK UTILITY
// =============================================================================

function triggerHaptic(type: "light" | "medium" | "heavy" = "medium") {
  if (typeof window === "undefined" || !navigator.vibrate) return;

  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30, 10, 30],
  };

  try {
    navigator.vibrate(patterns[type]);
  } catch {
    // Silently fail - haptics not supported
  }
}

// =============================================================================
// VISUAL SLIDER COMPONENTS
// =============================================================================

interface SugarSliderProps {
  value: number;
  onChange: (value: number) => void;
  options: Array<{ value: string; label: string }>;
}

function SugarSlider({ value, onChange, options }: SugarSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Map numeric values to slider positions
  const numericOptions = options.map(o => parseInt(o.value)).sort((a, b) => a - b);
  const currentIndex = numericOptions.indexOf(value);
  const percentage = numericOptions.length > 1
    ? (currentIndex / (numericOptions.length - 1)) * 100
    : 50;

  // Handle slider interaction (drag or click)
  const handleSliderInteraction = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = x / rect.width;

    // Snap to nearest option
    const nearestIndex = Math.round(percent * (numericOptions.length - 1));
    const newValue = numericOptions[nearestIndex];
    if (newValue !== value) {
      triggerHaptic("light");
      onChange(newValue);
    }
  }, [numericOptions, value, onChange]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSliderInteraction(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleSliderInteraction(e.clientX);
    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleSliderInteraction]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleSliderInteraction(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleSliderInteraction(e.touches[0].clientX);
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="space-y-1">
      {/* Draggable slider track */}
      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative h-6 rounded-full bg-amber-100 cursor-pointer touch-none select-none"
      >
        {/* Filled track */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-300 to-amber-500",
            isDragging ? "" : "transition-all duration-150"
          )}
          style={{ width: `${percentage}%` }}
        />
        {/* Thumb */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-amber-500 shadow-md",
            isDragging ? "scale-110" : "transition-all duration-150"
          )}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
        {/* Tick marks */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          {numericOptions.map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-amber-300/50" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface IceSliderProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

function IceSlider({ value, onChange, options }: IceSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate ice level based on position in options array
  const currentIndex = options.findIndex(o => o.value === value);
  const iceLevel = options.length > 1
    ? ((currentIndex === -1 ? options.length - 1 : currentIndex) / (options.length - 1)) * 100
    : 66;

  // Handle slider interaction (drag or click)
  const handleSliderInteraction = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = x / rect.width;

    // Snap to nearest option
    const nearestIndex = Math.round(percent * (options.length - 1));
    const newValue = options[nearestIndex]?.value;
    if (newValue && newValue !== value) {
      triggerHaptic("light");
      onChange(newValue);
    }
  }, [options, value, onChange]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSliderInteraction(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleSliderInteraction(e.clientX);
    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleSliderInteraction]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleSliderInteraction(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleSliderInteraction(e.touches[0].clientX);
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="space-y-1">
      {/* Draggable slider track */}
      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative h-6 rounded-full bg-sky-100 cursor-pointer touch-none select-none"
      >
        {/* Filled track */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-300 to-sky-500",
            isDragging ? "" : "transition-all duration-150"
          )}
          style={{ width: `${iceLevel}%` }}
        />
        {/* Thumb */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-sky-500 shadow-md",
            isDragging ? "scale-110" : "transition-all duration-150"
          )}
          style={{ left: `calc(${iceLevel}% - 10px)` }}
        />
        {/* Tick marks */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          {options.map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-sky-300/50" />
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [customImage, setCustomImage] = useState<string | null>(
    initialCustomizations?.customImage ?? null
  );

  // Camera capture translations
  const cameraTranslations = {
    takePhoto: locale === "nl" ? "Foto maken" : "Take Photo",
    retake: locale === "nl" ? "Opnieuw" : "Retake",
    usePhoto: locale === "nl" ? "Gebruiken" : "Use Photo",
    switchCamera: locale === "nl" ? "Camera wisselen" : "Switch Camera",
    cameraError: locale === "nl" ? "Camera niet beschikbaar" : "Camera not available",
    cameraPermission: locale === "nl" ? "Camera toegang geweigerd" : "Camera access denied",
    addYourPhoto: locale === "nl" ? "Voeg je foto toe" : "Add your photo",
    yourPhoto: locale === "nl" ? "Jouw foto" : "Your photo",
  };

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
    // Haptic feedback on add/update
    triggerHaptic("medium");

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
      imageUrl: customImage || product.imageUrl || undefined,
      customizations: {
        sugarLevel: selectedOptions["SUGAR_LEVEL"]
          ? parseInt(selectedOptions["SUGAR_LEVEL"])
          : undefined,
        iceLevel: selectedOptions["ICE_LEVEL"],
        size: selectedOptions["SIZE"],
        milkType: selectedOptions["MILK_TYPE"],
        toppings: toppingNames.length > 0 ? toppingNames : undefined,
        customImage: customImage || undefined,
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

  // Modal variant: clean, spacious, easy to tap
  if (variant === "modal") {
    return (
      <div className="flex flex-col max-h-[85vh]">
        {/* Product Image Header - Larger, more appetizing */}
        <div className="relative h-44 w-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-cream-100 via-tea-50 to-taro-50">
          {customImage ? (
            <img
              src={customImage}
              alt={productName}
              className="h-full w-full object-cover"
            />
          ) : product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={productName}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-6xl">🧋</span>
            </div>
          )}
          {/* Favorite button - top right */}
          <div className="absolute top-3 right-3">
            <FavoriteButton
              productId={product.id}
              size="default"
              variant="ghost"
              className="h-10 w-10 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-sm"
            />
          </div>
          {/* Subtle gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* Scrollable Content */}
        <div className="px-5 pb-4 -mt-8 relative flex-1 overflow-y-auto">
          {/* Product Info */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold leading-tight text-gray-900 line-clamp-2">{productName}</h2>
              {categoryName && (
                <p className="text-sm text-tea-600 font-medium mt-1">{categoryName}</p>
              )}
            </div>
            <span className="text-xl font-bold text-tea-600 shrink-0">
              €{Number(product.price).toFixed(2)}
            </span>
          </div>

          {/* Camera Capture - Add your own photo */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              {locale === "nl" ? "Maak het persoonlijk" : "Make it personal"}
            </label>
            <CameraCapture
              onCapture={setCustomImage}
              onClear={() => setCustomImage(null)}
              capturedImage={customImage}
              translations={cameraTranslations}
            />
          </div>

          {/* Customization Options - Visual sliders for sugar/ice */}
          {filteredCustomizationGroups.length > 0 && (
            <div className="space-y-5">
              {filteredCustomizationGroups.map((group) => {
                // Use visual slider for sugar level
                if (group.type === "SUGAR_LEVEL") {
                  const options = group.values.map((v) => ({
                    value: v.value,
                    label: v.translations[0]?.label || v.value,
                  }));
                  return (
                    <div key={group.id}>
                      <label className="mb-3 block text-sm font-semibold text-gray-700">
                        {getGroupLabel(group.type)}
                      </label>
                      <SugarSlider
                        value={parseInt(selectedOptions["SUGAR_LEVEL"] || "100")}
                        onChange={(val) =>
                          setSelectedOptions({ ...selectedOptions, SUGAR_LEVEL: String(val) })
                        }
                        options={options}
                      />
                    </div>
                  );
                }

                // Use visual slider for ice level
                if (group.type === "ICE_LEVEL") {
                  const options = group.values.map((v) => ({
                    value: v.value,
                    label: v.translations[0]?.label || v.value,
                  }));
                  // Find default or use last option (usually "normal")
                  const defaultIce = group.values.find(v => v.isDefault)?.value || options[options.length - 1]?.value || "";
                  return (
                    <div key={group.id}>
                      <label className="mb-3 block text-sm font-semibold text-gray-700">
                        {getGroupLabel(group.type)}
                      </label>
                      <IceSlider
                        value={selectedOptions["ICE_LEVEL"] || defaultIce}
                        onChange={(val) =>
                          setSelectedOptions({ ...selectedOptions, ICE_LEVEL: val })
                        }
                        options={options}
                      />
                    </div>
                  );
                }

                // Default button style for other customization types
                return (
                  <div key={group.id}>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
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
                            onClick={() => {
                              triggerHaptic("light");
                              setSelectedOptions({
                                ...selectedOptions,
                                [group.type]: option.value,
                              });
                            }}
                            className={cn(
                              "rounded-full px-4 py-2 text-sm font-medium transition-all border min-h-[40px]",
                              isSelected
                                ? "bg-tea-600 text-white border-tea-600 shadow-sm"
                                : "bg-white text-gray-700 border-gray-200 hover:border-tea-300 hover:bg-tea-50 active:bg-tea-100"
                            )}
                          >
                            {label}
                            {hasModifier && (
                              <span className={cn("ml-1", isSelected ? "text-white/70" : "text-gray-400")}>
                                +€{Number(option.priceModifier).toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Toppings - Clearer pricing, better touch targets */}
          {filteredToppings.length > 0 && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t("customize.toppings")}
                <span className="ml-1 text-xs font-normal text-gray-400">
                  ({locale === "nl" ? "optioneel" : "optional"})
                </span>
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
                        "rounded-full px-4 py-2 text-sm font-medium transition-all border flex items-center gap-2 min-h-[40px]",
                        isSelected
                          ? "bg-tea-600 text-white border-tea-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-tea-300 hover:bg-tea-50 active:bg-tea-100"
                      )}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                      <span>{topping.translations[0]?.name || formatSlug(topping.slug)}</span>
                      <span className={cn("text-sm", isSelected ? "text-white/70" : "text-gray-400")}>
                        +€{Number(topping.price).toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer: Quantity + Add Button */}
        <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            {/* Quantity controls */}
            <div className="flex items-center rounded-full bg-gray-100 border border-gray-200">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                  quantity <= 1 ? "text-gray-300" : "text-gray-600 hover:bg-white active:bg-gray-50"
                )}
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="w-8 text-center text-base font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-all hover:bg-white active:bg-gray-50"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Add to Cart / Update Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAddedToCart}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-base font-semibold transition-all",
                isAddedToCart
                  ? "bg-matcha-500 text-white"
                  : "bg-tea-600 text-white hover:bg-tea-700 active:bg-tea-800 shadow-lg shadow-tea-600/20"
              )}
            >
              {isAddedToCart ? (
                <>
                  <Check className="h-5 w-5" />
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
                      ? (locale === "nl" ? "Bijwerken" : "Update")
                      : (locale === "nl" ? "Toevoegen" : "Add to cart")}
                  </span>
                  <span className="mx-1.5 h-5 w-px bg-white/30" />
                  <span className="tabular-nums font-bold">€{totalPrice.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Page variant: full layout with large image
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Product Image - large for page view */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-tea-50 to-taro-50">
        {customImage ? (
          <img
            src={customImage}
            alt={productName}
            className="h-full w-full object-cover"
          />
        ) : product.imageUrl ? (
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

        {/* Camera Capture - Add your own photo */}
        <div className="border-t border-gray-100 pt-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {locale === "nl" ? "Maak het persoonlijk" : "Make it personal"}
          </label>
          <CameraCapture
            onCapture={setCustomImage}
            onClear={() => setCustomImage(null)}
            capturedImage={customImage}
            translations={cameraTranslations}
          />
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
