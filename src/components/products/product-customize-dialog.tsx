"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProductCustomization, ProductData, CustomizationGroup, ToppingData } from "./product-customization";
import { api } from "@/lib/trpc";

interface ProductCustomizeDialogProps {
  product: {
    id: string;
    slug: string;
    price: number | string | { toString(): string };
    imageUrl: string | null;
    vegan: boolean;
    caffeine: boolean;
    calories: number | null;
    allowSugarCustomization: boolean;
    allowIceCustomization: boolean;
    allowToppings: boolean;
    translations: Array<{ name: string; description?: string | null }>;
    category?: {
      slug: string;
      translations: Array<{ name: string }>;
    } | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductCustomizeDialog({
  product,
  open,
  onOpenChange,
}: ProductCustomizeDialogProps) {
  const locale = useLocale() as "nl" | "en";

  // Product data is now passed directly - no fetch needed!
  // Build ProductData from passed product (convert Decimal to number, normalize types)
  const productData: ProductData = {
    id: product.id,
    slug: product.slug,
    price: Number(product.price),
    imageUrl: product.imageUrl,
    vegan: product.vegan,
    caffeine: product.caffeine,
    calories: product.calories,
    allowSugarCustomization: product.allowSugarCustomization,
    allowIceCustomization: product.allowIceCustomization,
    allowToppings: product.allowToppings,
    translations: product.translations.map(t => ({
      name: t.name,
      description: t.description ?? null,
    })),
    category: product.category ?? null,
  };

  // Fetch customization options (cache longer - these rarely change)
  // These are pre-fetched on menu page, so should be instant from cache
  const { data: customizationGroups, isLoading: customizationsLoading } =
    api.customizations.getAll.useQuery(
      { locale },
      {
        enabled: open,
        staleTime: 10 * 60 * 1000, // 10 minutes cache - rarely changes
      }
    );

  // Fetch toppings (cache longer - these rarely change)
  // These are pre-fetched on menu page, so should be instant from cache
  const { data: toppings, isLoading: toppingsLoading } = api.toppings.getAll.useQuery(
    { locale, onlyAvailable: true },
    {
      enabled: open,
      staleTime: 10 * 60 * 1000, // 10 minutes cache - rarely changes
    }
  );

  const isLoading = customizationsLoading || toppingsLoading;

  // Convert customization groups (Decimal to number)
  const convertedCustomizationGroups: CustomizationGroup[] | undefined = customizationGroups?.map((group) => ({
    id: group.id,
    type: group.type,
    values: group.values.map((value) => ({
      id: value.id,
      value: value.value,
      priceModifier: Number(value.priceModifier),
      isDefault: value.isDefault,
      translations: value.translations,
    })),
  }));

  // Convert toppings (Decimal to number)
  const convertedToppings: ToppingData[] | undefined = toppings?.map((topping) => ({
    id: topping.id,
    slug: topping.slug,
    price: Number(topping.price),
    translations: topping.translations,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md w-[calc(100vw-2rem)] p-0 gap-0 overflow-hidden rounded-3xl !fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !bottom-auto !right-auto max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">
          {product.translations[0]?.name || product.slug}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {locale === "nl"
            ? "Pas je drankje aan met suiker, ijs en toppings"
            : "Customize your drink with sugar, ice, and toppings"}
        </DialogDescription>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-tea-600" />
          </div>
        ) : convertedCustomizationGroups && convertedToppings ? (
          <ProductCustomization
            product={productData}
            customizationGroups={convertedCustomizationGroups}
            toppings={convertedToppings}
            variant="modal"
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
