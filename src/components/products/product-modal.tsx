"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { useProductModal } from "@/hooks/use-product-modal";
import { api } from "@/lib/trpc";
import {
  Minus,
  Plus,
  Leaf,
  Coffee,
  Loader2,
  ShoppingCart,
  Check,
} from "lucide-react";

export function ProductModal() {
  const t = useTranslations("product");
  const tMenu = useTranslations("menu");
  const locale = useLocale() as "nl" | "en";

  const { isOpen, productSlug, closeModal } = useProductModal();
  const addItem = useCartStore((state) => state.addItem);

  // State
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  // Fetch product - only when modal is open
  const { data: product, isLoading: productLoading } = api.products.getBySlug.useQuery(
    { slug: productSlug!, locale },
    { enabled: !!productSlug && isOpen }
  );

  // Fetch customization options (data-driven!)
  const { data: customizationGroups } = api.customizations.getAll.useQuery(
    { locale },
    { enabled: isOpen }
  );

  // Fetch toppings
  const { data: toppings } = api.toppings.getAll.useQuery(
    { locale, onlyAvailable: true },
    { enabled: isOpen }
  );

  // Reset state when product changes
  useEffect(() => {
    if (productSlug && customizationGroups) {
      setQuantity(1);
      setSelectedToppings([]);
      setIsAddedToCart(false);

      // Set defaults from database
      const defaults: Record<string, string> = {};
      customizationGroups.forEach((group) => {
        const defaultValue = group.values.find((v) => v.isDefault);
        if (defaultValue) {
          defaults[group.type] = defaultValue.value;
        } else if (group.values.length > 0) {
          // Fallback to first value if no default
          defaults[group.type] = group.values[0].value;
        }
      });
      setSelectedOptions(defaults);
    }
  }, [productSlug, customizationGroups]);

  // Calculate total price (including price modifiers)
  const totalPrice = useMemo(() => {
    if (!product) return 0;

    let price = Number(product.price);

    // Add customization price modifiers
    customizationGroups?.forEach((group) => {
      const selectedValue = selectedOptions[group.type];
      const option = group.values.find((v) => v.value === selectedValue);
      if (option) {
        price += Number(option.priceModifier);
      }
    });

    // Add toppings
    selectedToppings.forEach((id) => {
      const topping = toppings?.find((t) => t.id === id);
      if (topping) price += Number(topping.price);
    });

    return price * quantity;
  }, [product, customizationGroups, selectedOptions, toppings, selectedToppings, quantity]);

  const handleAddToCart = () => {
    if (!product) return;

    const toppingNames = selectedToppings
      .map((id) => toppings?.find((t) => t.id === id)?.translations[0]?.name || "")
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
      closeModal();
    }, 1000);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="overflow-hidden p-0">
        {productLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        ) : product ? (
          <div className="grid gap-0 sm:grid-cols-2">
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-tea-50 to-taro-50 sm:aspect-auto sm:h-full">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.translations[0]?.name || product.slug}
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
            </div>

            {/* Customization Options */}
            <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto p-6 sm:max-h-[70vh]">
              {/* Header */}
              <div>
                <p className="text-xs font-medium text-tea-600 mb-1">
                  {product.category?.translations[0]?.name || product.category?.slug}
                </p>
                <h2 className="text-2xl font-bold">
                  {product.translations[0]?.name || product.slug}
                </h2>
                <p className="text-xl font-bold text-tea-600 mt-1">
                  €{Number(product.price).toFixed(2)}
                </p>
                {product.translations[0]?.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {product.translations[0].description}
                  </p>
                )}
              </div>

              {/* Dynamic Customization Groups */}
              {customizationGroups && customizationGroups.length > 0 && (
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
              {toppings && toppings.length > 0 && (
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
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
