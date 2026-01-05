"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { api } from "@/lib/trpc";
import { Settings2, Plus, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductQuickCustomizeProps {
  product: {
    id: string;
    slug: string;
    price: unknown;
    imageUrl: string | null;
    translations: Array<{ name: string; description?: string | null }>;
  };
  triggerClassName?: string;
  showTriggerText?: boolean;
}

export function ProductQuickCustomize({
  product,
  triggerClassName,
  showTriggerText = true,
}: ProductQuickCustomizeProps) {
  const t = useTranslations("product");
  const tMenu = useTranslations("menu");
  const locale = useLocale() as "nl" | "en";

  const [open, setOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [isAdded, setIsAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  // Fetch customization options
  const { data: customizationGroups, isLoading: customizationsLoading } =
    api.customizations.getAll.useQuery({ locale }, { enabled: open });

  // Fetch toppings
  const { data: toppings } = api.toppings.getAll.useQuery(
    { locale, onlyAvailable: true },
    { enabled: open }
  );

  // Set defaults when groups load
  useEffect(() => {
    if (customizationGroups && open) {
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
      setSelectedToppings([]);
      setIsAdded(false);
    }
  }, [customizationGroups, open]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    let price = Number(product.price);

    customizationGroups?.forEach((group) => {
      const selectedValue = selectedOptions[group.type];
      const option = group.values.find((v) => v.value === selectedValue);
      if (option) {
        price += Number(option.priceModifier);
      }
    });

    selectedToppings.forEach((id) => {
      const topping = toppings?.find((t) => t.id === id);
      if (topping) price += Number(topping.price);
    });

    return price;
  }, [product.price, customizationGroups, selectedOptions, toppings, selectedToppings]);

  const handleAddToCart = () => {
    const toppingNames = selectedToppings
      .map((id) => toppings?.find((t) => t.id === id)?.translations[0]?.name || "")
      .filter(Boolean);

    addItem({
      productId: product.id,
      name: product.translations[0]?.name || product.slug,
      price: totalPrice,
      quantity: 1,
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

    setIsAdded(true);
    setTimeout(() => {
      setOpen(false);
      setIsAdded(false);
    }, 800);
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1", triggerClassName)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Settings2 className="h-4 w-4" />
          {showTriggerText && tMenu("customize")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 p-0"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {customizationsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-tea-600" />
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b border-cream-100 px-4 py-3">
              <h3 className="font-medium text-tea-900 line-clamp-1">
                {product.translations[0]?.name || product.slug}
              </h3>
              <p className="text-sm text-tea-600 font-semibold">
                €{Number(product.price).toFixed(2)}
              </p>
            </div>

            {/* Customization Options */}
            <div className="space-y-4 p-4">
              {customizationGroups?.map((group) => (
                <div key={group.id}>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {getGroupLabel(group.type)}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
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
                            "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                            isSelected
                              ? "bg-tea-600 text-white shadow-sm"
                              : "bg-cream-100 text-tea-700 hover:bg-cream-200"
                          )}
                        >
                          {label}
                          {Number(option.priceModifier) > 0 && (
                            <span className="ml-1 opacity-70">
                              +€{Number(option.priceModifier).toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Toppings */}
              {toppings && toppings.length > 0 && (
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("customize.toppings")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {toppings.map((topping) => {
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
                            "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                            isSelected
                              ? "bg-tea-600 text-white shadow-sm"
                              : "bg-cream-100 text-tea-700 hover:bg-cream-200"
                          )}
                        >
                          {isSelected && <Check className="mr-1 inline h-3 w-3" />}
                          {topping.translations[0]?.name || topping.slug}
                          <span className="ml-1 opacity-70">
                            +€{Number(topping.price).toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-cream-100 p-4">
              <Button
                variant="tea"
                size="sm"
                className="w-full"
                onClick={handleAddToCart}
                disabled={isAdded}
              >
                {isAdded ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4" />
                    {locale === "nl" ? "Toegevoegd!" : "Added!"}
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 h-4 w-4" />
                    {tMenu("addToCart")} · €{totalPrice.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
