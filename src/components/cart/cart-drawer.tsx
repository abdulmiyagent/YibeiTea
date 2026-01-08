"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const t = useTranslations("cart");
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const subtotal = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.price * item.quantity, 0)
  );
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
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
                      className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                    >
                      {/* Product Image */}
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-tea-50 to-cream-50">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-12 w-12 object-contain"
                          />
                        ) : (
                          <span className="text-2xl">🧋</span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-tea-900 leading-tight">
                            {item.name}
                          </h3>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-2 text-gray-400 transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Customizations */}
                        {item.customizations && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.customizations.sugarLevel !== undefined && (
                              <span className="rounded bg-cream-100 px-1.5 py-0.5 text-[10px] text-cream-700">
                                {item.customizations.sugarLevel}% suiker
                              </span>
                            )}
                            {item.customizations.iceLevel && (
                              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] text-sky-700">
                                {item.customizations.iceLevel} ijs
                              </span>
                            )}
                            {item.customizations.toppings && item.customizations.toppings.length > 0 && (
                              <span className="rounded bg-taro-100 px-1.5 py-0.5 text-[10px] text-taro-700">
                                +{item.customizations.toppings.length} topping{item.customizations.toppings.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Price & Quantity */}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-semibold text-tea-600">
                            {formatPrice(item.price * item.quantity)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full
                                border border-gray-200 text-gray-500 transition-colors
                                hover:border-tea-300 hover:bg-tea-50 hover:text-tea-600"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full
                                border border-gray-200 text-gray-500 transition-colors
                                hover:border-tea-300 hover:bg-tea-50 hover:text-tea-600"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
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
    </>
  );
}
