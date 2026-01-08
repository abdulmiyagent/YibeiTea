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

  // Fetch full product details (cache for 2 min, prefetch on hover would be nice)
  const { data: fullProduct, isLoading: productLoading } = api.products.getBySlug.useQuery(
    { slug: product.slug, locale },
    {
      enabled: open,
      staleTime: 2 * 60 * 1000, // 2 minutes cache
    }
  );

  // Fetch customization options (cache longer - these rarely change)
  const { data: customizationGroups, isLoading: customizationsLoading } =
    api.customizations.getAll.useQuery(
      { locale },
      {
        enabled: open,
        staleTime: 10 * 60 * 1000, // 10 minutes cache - rarely changes
      }
    );

  // Fetch toppings (cache longer - these rarely change)
  const { data: toppings, isLoading: toppingsLoading } = api.toppings.getAll.useQuery(
    { locale, onlyAvailable: true },
    {
      enabled: open,
      staleTime: 10 * 60 * 1000, // 10 minutes cache - rarely changes
    }
  );

  const isLoading = productLoading || customizationsLoading || toppingsLoading;

  // Build ProductData from fullProduct (convert Decimal to number)
  const productData: ProductData | null = fullProduct
    ? {
        id: fullProduct.id,
        slug: fullProduct.slug,
        price: Number(fullProduct.price),
        imageUrl: fullProduct.imageUrl,
        vegan: fullProduct.vegan,
        caffeine: fullProduct.caffeine,
        calories: fullProduct.calories,
        allowSugarCustomization: fullProduct.allowSugarCustomization,
        allowIceCustomization: fullProduct.allowIceCustomization,
        allowToppings: fullProduct.allowToppings,
        translations: fullProduct.translations,
        category: fullProduct.category,
      }
    : null;

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
        className="max-w-sm p-0 gap-0 overflow-hidden rounded-2xl !fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !bottom-auto !right-auto">
        <DialogTitle className="sr-only">
          {product.translations[0]?.name || product.slug}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Pas je drankje aan met suiker, ijs en toppings
        </DialogDescription>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-tea-600" />
          </div>
        ) : productData && convertedCustomizationGroups && convertedToppings ? (
          <ProductCustomization
            product={productData}
            customizationGroups={convertedCustomizationGroups}
            toppings={convertedToppings}
            variant="modal"
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-500">
            Product niet gevonden
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
