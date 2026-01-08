"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCartStore, CartItem } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { ProductCustomizeDialog } from "@/components/products/product-customize-dialog";
import { api } from "@/lib/trpc";
import Image from "next/image";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const t = useTranslations("cart");
  const locale = useLocale() as "nl" | "en";
  const [mounted, setMounted] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const subtotal = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.price * item.quantity, 0)
  );
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );

  // Fetch product data when editing (only when editingItem is set)
  const { data: editingProduct } = api.products.getById.useQuery(
    { id: editingItem?.productId ?? "", locale },
    { enabled: !!editingItem }
  );

  // Hydration fix: wait for client-side mount before showing cart items
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-50 h-[100dvh] w-full max-w-md
          flex flex-col
          border-l border-white/20 bg-white/95 backdrop-blur-xl
          shadow-[-8px_0_32px_rgba(0,0,0,0.1)]
          animate-in slide-in-from-right duration-300"
      >
        {/* Header - with safe area for notches/Dynamic Island */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-tea-600" />
            <h2 className="font-serif text-lg font-medium text-tea-900">
              {t("title")}
            </h2>
            {itemCount > 0 && (
              <Badge variant="tea" className="h-5 min-w-5 rounded-full px-1.5 text-xs">
                {itemCount}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full
              bg-gray-100 text-gray-500 transition-colors
              hover:bg-gray-200 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cream-100">
                <ShoppingBag className="h-10 w-10 text-cream-400" />
              </div>
              <p className="text-muted-foreground">{t("empty")}</p>
              <Link href="/menu" onClick={onClose}>
                <Button variant="tea" className="mt-6 rounded-full">
                  {t("continueShopping")}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="flex-1 overflow-y-auto min-h-0 p-4">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex gap-3">
                        {/* Product Image */}
                        <div className="relative h-16 w-16 flex-shrink-0 rounded-xl bg-gradient-to-br from-cream-50 to-tea-50 overflow-hidden">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <span className="text-2xl">🧋</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex flex-1 flex-col min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-gray-900 leading-tight line-clamp-2">
                              {item.name}
                            </h3>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 text-gray-400 transition-colors hover:text-tea-600 hover:bg-tea-50 rounded-full"
                                aria-label={locale === "nl" ? "Bewerken" : "Edit"}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 text-gray-400 transition-colors hover:text-red-500 hover:bg-red-50 rounded-full"
                                aria-label={locale === "nl" ? "Verwijderen" : "Remove"}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Customizations - More readable */}
                          {item.customizations && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {item.customizations.sugarLevel !== undefined && (
                                <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-medium text-cream-800">
                                  {item.customizations.sugarLevel}% {locale === "nl" ? "suiker" : "sugar"}
                                </span>
                              )}
                              {item.customizations.iceLevel && (
                                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                                  {item.customizations.iceLevel} {locale === "nl" ? "ijs" : "ice"}
                                </span>
                              )}
                              {item.customizations.toppings && item.customizations.toppings.length > 0 && (
                                <span className="rounded-full bg-taro-100 px-2 py-0.5 text-xs font-medium text-taro-700">
                                  +{item.customizations.toppings.length} topping{item.customizations.toppings.length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Price */}
                          <span className="mt-1.5 font-semibold text-tea-600">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls - Larger, separate row for clarity */}
                      <div className="mt-3 flex items-center justify-end">
                        <div className="flex items-center rounded-full bg-gray-100 border border-gray-200">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                              item.quantity <= 1
                                ? "text-gray-300"
                                : "text-gray-600 hover:bg-white active:bg-gray-50"
                            )}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-all hover:bg-white active:bg-gray-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t border-gray-100 bg-white/80 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-muted-foreground">{t("subtotal")}</span>
                  <span className="text-lg font-bold text-tea-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link href="/cart" onClick={onClose} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-tea-200 hover:bg-tea-50"
                    >
                      {t("viewCart")}
                    </Button>
                  </Link>
                  <Link href="/checkout" onClick={onClose} className="flex-1">
                    <Button variant="tea" className="w-full rounded-full">
                      {t("checkout")}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Item Dialog */}
      {editingItem && editingProduct && (
        <ProductCustomizeDialog
          product={{
            id: editingProduct.id,
            slug: editingProduct.slug,
            price: Number(editingProduct.price),
            imageUrl: editingProduct.imageUrl,
            vegan: editingProduct.vegan,
            caffeine: editingProduct.caffeine,
            calories: editingProduct.calories,
            allowSugarCustomization: editingProduct.allowSugarCustomization,
            allowIceCustomization: editingProduct.allowIceCustomization,
            allowToppings: editingProduct.allowToppings,
            translations: editingProduct.translations,
            category: editingProduct.category,
          }}
          open={!!editingItem}
          onOpenChange={(open) => {
            if (!open) setEditingItem(null);
          }}
          initialCustomizations={editingItem.customizations}
          initialQuantity={editingItem.quantity}
          editMode={true}
          cartItemId={editingItem.id}
        />
      )}
    </>
  );
}
