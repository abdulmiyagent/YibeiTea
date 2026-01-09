"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart-store";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Tag,
  Gift,
} from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

export default function CartPage() {
  const t = useTranslations("cart");
  const {
    items,
    promoCode,
    discount,
    removeItem,
    updateQuantity,
    clearCart,
    applyPromoCode,
    removePromoCode,
    getSubtotal,
    getTotal,
    getItemCount,
  } = useCartStore();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");

  const handleApplyPromo = () => {
    // Simple promo code validation (would call API in production)
    if (promoInput.toUpperCase() === "YIBEI10") {
      applyPromoCode("YIBEI10", getSubtotal() * 0.1);
      setPromoError("");
    } else if (promoInput.toUpperCase() === "WELCOME") {
      applyPromoCode("WELCOME", 2);
      setPromoError("");
    } else {
      setPromoError(t("promoCode.invalid"));
    }
  };

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-cream-100 to-tea-50 shadow-soft">
              <ShoppingBag className="h-14 w-14 text-tea-400" />
            </div>
            <h1 className="heading-2 text-bordeaux-800">{t("title")}</h1>
            <p className="mt-4 text-muted-foreground">{t("empty")}</p>
            <Link href="/menu" className="mt-8 inline-block">
              <Button variant="tea" size="lg" className="rounded-full px-8 shadow-md transition-all hover:shadow-lg">
                {t("continueShopping")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container-custom">
        <h1 className="heading-1">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">
          {itemCount} {itemCount === 1 ? t("item") : t("items")}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden rounded-2xl border-gray-100 shadow-soft">
              <CardContent className="divide-y divide-gray-100 p-0">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 md:p-6"
                  >
                    {/* Product Image */}
                    <div className="relative h-20 w-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-tea-50 to-taro-50 overflow-hidden">
                      <Image
                        src={item.imageUrl || "/images/categories/placeholder.svg"}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                        loading="lazy"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-2">{item.name}</h3>
                      {item.customizations && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.customizations.sugarLevel !== undefined && (
                            <Badge variant="outline" className="text-xs bg-cream-50 border-cream-200 text-cream-700">
                              {item.customizations.sugarLevel}% suiker
                            </Badge>
                          )}
                          {item.customizations.iceLevel && (
                            <Badge variant="outline" className="text-xs bg-sky-50 border-sky-200 text-sky-700">
                              {item.customizations.iceLevel} ijs
                            </Badge>
                          )}
                          {item.customizations.toppings && item.customizations.toppings.length > 0 && (
                            item.customizations.toppings.map((topping, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-taro-50 border-taro-200 text-taro-700">
                                + {topping}
                              </Badge>
                            ))
                          )}
                        </div>
                      )}
                      <p className="mt-2 font-medium text-tea-600">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-all hover:bg-white hover:text-tea-600 hover:shadow-sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-semibold text-tea-900">
                        {item.quantity}
                      </span>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-all hover:bg-white hover:text-tea-600 hover:shadow-sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="hidden text-right md:block">
                      <p className="font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="justify-between border-t p-4">
                <Link href="/menu">
                  <Button variant="ghost" size="sm">
                    {t("continueShopping")}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={clearCart}
                >
                  Winkelwagen legen
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 overflow-hidden rounded-2xl border-gray-100 shadow-soft">
              <CardHeader className="bg-gradient-to-b from-cream-50 to-white pb-4">
                <CardTitle className="text-tea-900">Overzicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Promo Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("promoCode.label")}
                  </label>
                  {promoCode ? (
                    <div className="flex items-center justify-between rounded-lg bg-matcha-50 p-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-matcha-600" />
                        <span className="font-medium text-matcha-700">
                          {promoCode}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removePromoCode}
                      >
                        {t("remove")}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder={t("promoCode.placeholder")}
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                      />
                      <Button variant="outline" onClick={handleApplyPromo}>
                        {t("promoCode.apply")}
                      </Button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-sm text-destructive">{promoError}</p>
                  )}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("subtotal")}
                    </span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-matcha-600">
                      <span>{t("discount")}</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>{t("total")}</span>
                  <span className="text-tea-600">{formatPrice(total)}</span>
                </div>

                {/* Loyalty Points Preview */}
                <div className="flex items-center gap-2 rounded-lg bg-tea-50 p-3 text-sm">
                  <Gift className="h-4 w-4 text-tea-600" />
                  <span>
                    Je verdient <strong>{Math.floor(total * 10)}</strong> punten
                    met deze bestelling
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/checkout" className="w-full">
                  <Button variant="tea" size="lg" className="w-full rounded-full shadow-md transition-all hover:shadow-lg">
                    {t("checkout")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
