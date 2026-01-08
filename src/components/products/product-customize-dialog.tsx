"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
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

  // Fetch full product details
  const { data: fullProduct, isLoading: productLoading } = api.products.getBySlug.useQuery(
    { slug: product.slug, locale },
    { enabled: open }
  );

  // Fetch customization options
  const { data: customizationGroups, isLoading: customizationsLoading } =
    api.customizations.getAll.useQuery({ locale }, { enabled: open });

  // Fetch toppings
  const { data: toppings, isLoading: toppingsLoading } = api.toppings.getAll.useQuery(
    { locale, onlyAvailable: true },
    { enabled: open }
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
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogTitle className="sr-only">
          {product.translations[0]?.name || product.slug}
        </DialogTitle>

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

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
