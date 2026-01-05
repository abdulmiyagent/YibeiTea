"use client";

import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import {
  ProductCustomization,
  type ProductData,
  type CustomizationGroup,
  type ToppingData,
} from "@/components/products/product-customization";

// =============================================================================
// FLOATING CARD SHELL - Compact glassmorphic popover
// Small, elegant, non-intrusive customization panel
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

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  return (
    <>
      {/* Subtle backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Floating glassmorphic card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-3xl
            border border-white/30 bg-white/85 backdrop-blur-xl
            shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.1)_inset]
            animate-in fade-in-0 zoom-in-95 duration-200"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center
              rounded-full bg-gray-100/80 text-gray-500 transition-colors
              hover:bg-gray-200/80 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="max-h-[75vh] overflow-y-auto">
            <ProductCustomization
              product={product}
              customizationGroups={customizationGroups}
              toppings={toppings}
              variant="modal"
            />
          </div>
        </div>
      </div>
    </>
  );
}
