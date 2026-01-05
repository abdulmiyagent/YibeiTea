"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ProductCustomization,
  type ProductData,
  type CustomizationGroup,
  type ToppingData,
} from "@/components/products/product-customization";

// =============================================================================
// MODAL SHELL - Only handles Dialog wrapper, no business logic
// =============================================================================

interface ProductModalShellProps {
  product: ProductData;
  customizationGroups: CustomizationGroup[];
  toppings: ToppingData[];
}

export function ProductModalShell({
  product,
  customizationGroups,
  toppings,
}: ProductModalShellProps) {
  const router = useRouter();

  // Modal closes via router.back() - this is the key architectural decision
  // No custom state needed, browser back button works natively
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <ProductCustomization
          product={product}
          customizationGroups={customizationGroups}
          toppings={toppings}
          variant="modal"
        />
      </DialogContent>
    </Dialog>
  );
}
