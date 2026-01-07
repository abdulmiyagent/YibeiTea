"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/trpc";
import {
  Heart,
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  Leaf,
} from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

export default function FavoritesPage() {
  const t = useTranslations("account");
  const tMenu = useTranslations("menu");
  const locale = useLocale() as "nl" | "en";
  const { data: session, status } = useSession();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const utils = api.useUtils();

  const { data: favorites, isLoading } = api.users.getFavorites.useQuery(
    { locale },
    { enabled: status === "authenticated" }
  );

  const removeFavorite = api.users.removeFavorite.useMutation({
    onSuccess: () => {
      utils.users.getFavorites.invalidate();
    },
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleAddToCart = (product: NonNullable<typeof favorites>[0]) => {
    const translation = product.translations[0];
    addItem({
      productId: product.id,
      name: translation?.name || product.slug,
      price: Number(product.price),
      quantity: 1,
      imageUrl: product.imageUrl || undefined,
      customizations: {
        sugarLevel: 100,
        iceLevel: "normal",
      },
    });
  };

  const handleRemoveFavorite = (productId: string) => {
    removeFavorite.mutate({ productId });
  };

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {locale === "nl" ? "Terug naar account" : "Back to account"}
            </Button>
          </Link>
          <h1 className="heading-1 flex items-center gap-3">
            <Heart className="h-8 w-8 text-tea-600" />
            {t("favorites.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {locale === "nl"
              ? "Je favoriete drankjes voor snelle herbestellingen"
              : "Your favorite drinks for quick reordering"}
          </p>
        </div>

        {/* Favorites Grid */}
        {favorites && favorites.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((product) => {
              const translation = product.translations[0];
              const categoryTranslation = product.category?.translations[0];

              return (
                <Card
                  key={product.id}
                  className="group overflow-hidden transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Thumbnail */}
                    <Link
                      href={`/menu/${product.slug}`}
                      className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-tea-50 to-taro-50"
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={translation?.name || product.slug}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-2xl">🧋</span>
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-tea-600 font-medium">
                          {categoryTranslation?.name || product.category?.slug}
                        </p>
                        {product.vegan && (
                          <Leaf className="h-3 w-3 text-matcha-500" />
                        )}
                      </div>
                      <Link href={`/menu/${product.slug}`}>
                        <h3 className="font-semibold text-sm mt-0.5 line-clamp-1 hover:text-tea-600">
                          {translation?.name || product.slug}
                        </h3>
                      </Link>
                      <span className="text-sm font-bold text-tea-600 mt-0.5 block">
                        €{Number(product.price).toFixed(2)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5">
                      <Button
                        size="icon"
                        variant="tea"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleAddToCart(product)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleRemoveFavorite(product.id)}
                        disabled={removeFavorite.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">{t("favorites.empty")}</h3>
            <p className="mt-2 text-muted-foreground">
              {locale === "nl"
                ? "Voeg drankjes toe aan je favorieten door op het hartje te klikken"
                : "Add drinks to your favorites by clicking the heart icon"}
            </p>
            <Link href="/menu">
              <Button variant="tea" className="mt-6">
                <ShoppingBag className="mr-2 h-4 w-4" />
                {locale === "nl" ? "Bekijk menu" : "Browse menu"}
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
