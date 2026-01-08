"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useRef, useCallback, memo, useState, lazy, Suspense } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc";
import {
  Star,
  Sparkles,
  ArrowRight,
  MapPin,
  Phone,
  ChevronRight,
  Coffee,
  Droplets,
  Citrus,
  GlassWater,
  Loader2,
  Heart,
} from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { ProductCarousel } from "@/components/ProductCarousel";
import Image from "next/image";
import type { FeaturedProduct, Category, StoreSettings } from "@/lib/server-data";

// Lazy load Framer Motion for better initial bundle size
const HeroSection = lazy(() => import("./HomeMotionComponents"));

// Static reviews data
const reviews = [
  {
    id: "1",
    name: "Emma V.",
    rating: 5,
    comment: "Beste bubble tea in Gent! De taro is gewoon perfect.",
    avatar: "E",
  },
  {
    id: "2",
    name: "Thomas D.",
    rating: 5,
    comment: "Super vriendelijk personeel en heerlijke drankjes. Kom hier elke week!",
    avatar: "T",
  },
  {
    id: "3",
    name: "Lisa M.",
    rating: 5,
    comment: "Eindelijk echte bubble tea met verse tapioca pearls. Aanrader!",
    avatar: "L",
  },
];

// Static category icons mapping
const categoryIcons: Record<string, { icon: typeof Coffee; color: string }> = {
  "brown-sugar": { icon: Coffee, color: "amber" },
  "milk-tea": { icon: Droplets, color: "taro" },
  "cream-cheese": { icon: Coffee, color: "cream" },
  "iced-coffee": { icon: Coffee, color: "tea" },
  "hot-coffee": { icon: Coffee, color: "tea" },
  "ice-tea": { icon: Citrus, color: "matcha" },
  "mojito": { icon: GlassWater, color: "sky" },
  "kids-star": { icon: Sparkles, color: "rose" },
  "latte-special": { icon: Coffee, color: "taro" },
  "frappucchino": { icon: Coffee, color: "tea" },
};

// Loading fallback for motion components
function MotionFallback() {
  return (
    <div className="animate-pulse">
      <div className="h-96 bg-cream-100 rounded-3xl" />
    </div>
  );
}

interface HomePageClientProps {
  featuredProducts: FeaturedProduct[];
  categories: Category[];
  storeSettings: StoreSettings;
  locale: "nl" | "en";
}

export function HomePageClient({
  featuredProducts,
  categories,
  storeSettings,
  locale,
}: HomePageClientProps) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const { data: session } = useSession();

  // Fetch user's favorites only (lightweight, user-specific)
  const { data: userFavorites, isLoading: favoritesLoading } = api.users.getFavorites.useQuery(
    { locale },
    { enabled: !!session?.user }
  );

  // Cart functionality
  const addItem = useCartStore((state) => state.addItem);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  const handleQuickAdd = useCallback(
    (e: React.MouseEvent, product: FeaturedProduct) => {
      e.preventDefault();
      e.stopPropagation();

      const translation = product.translations[0];
      addItem({
        productId: product.id,
        name: translation?.name || product.slug,
        price: Number(product.price),
        quantity: 1,
        imageUrl: product.imageUrl || undefined,
        customizations: {
          sugarLevel: 100,
          iceLevel: "100%",
          toppings: [],
        },
      });

      setAddedProducts((prev) => new Set(prev).add(product.id));
      setTimeout(() => {
        setAddedProducts((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
      }, 2000);
    },
    [addItem]
  );

  return (
    <>
      {/* Hero Section with lazy-loaded animations */}
      <Suspense fallback={<MotionFallback />}>
        <HeroSection t={t} tCommon={tCommon} />
      </Suspense>

      {/* Featured Products - Server data, no loading state needed */}
      <section className="section-padding relative overflow-hidden bg-white">
        <div className="container-custom">
          <div className="text-center">
            <span className="decorative-line text-sm font-medium uppercase tracking-widest text-tea-600">
              {t("featured.title")}
            </span>
            <h2 className="heading-2 mt-4 text-bordeaux-800">
              {t("featured.subtitle")}
            </h2>
          </div>

          <div className="mt-16">
            <ProductCarousel products={featuredProducts} showFavoriteButton />
          </div>

          <div className="mt-12 text-center">
            <Link href="/menu">
              <Button
                variant="outline"
                size="lg"
                className="group rounded-full border-2 border-tea-200 px-8 font-medium transition-all hover:border-tea-300 hover:bg-tea-50"
              >
                {t("featured.viewAll")}
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* My Favorites Section - Only shown when logged in */}
      {session?.user && (
        <section className="section-padding relative overflow-hidden bg-gradient-to-b from-cream-50 to-white">
          <div className="container-custom">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                <span className="decorative-line text-sm font-medium uppercase tracking-widest text-tea-600">
                  {t("myFavorites.title")}
                </span>
              </div>
              <h2 className="heading-2 mt-4 text-bordeaux-800">
                {t("myFavorites.subtitle")}
              </h2>
            </div>

            {favoritesLoading ? (
              <div className="mt-16 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
              </div>
            ) : userFavorites && userFavorites.length > 0 ? (
              <div className="mt-16">
                <ProductCarousel products={userFavorites} showFavoriteButton />
              </div>
            ) : (
              <div className="mt-16 text-center">
                <div className="mx-auto max-w-md rounded-3xl border border-cream-200 bg-white p-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                    <Heart className="h-8 w-8 text-rose-400" />
                  </div>
                  <h3 className="mt-6 font-serif text-xl font-medium text-tea-900">
                    {t("myFavorites.empty")}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {t("myFavorites.emptySubtitle")}
                  </p>
                  <Link href="/menu" className="mt-6 inline-block">
                    <Button className="rounded-full bg-tea-600 px-8 hover:bg-tea-700">
                      {t("myFavorites.browseMenu")}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Loyalty CTA Section */}
      <section className="section-padding relative overflow-hidden bg-gradient-to-br from-tea-600 via-tea-700 to-tea-800">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-tea-500/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-matcha-500/20 blur-3xl" />
        </div>

        <div className="container-custom relative">
          <div className="mx-auto max-w-3xl text-center">
            {session?.user ? (
              <>
                <div className="mb-4 flex justify-center">
                  <span className="text-4xl">🧋</span>
                </div>
                <h2 className="heading-2 text-white">
                  {t("loyalty.welcomeTitle")}
                </h2>
                <p className="mt-4 text-lg text-tea-100">
                  {t("loyalty.welcomeSubtitle")}
                </p>

                <div className="mt-10 flex flex-wrap justify-center gap-4">
                  {["welcomeBenefit1", "welcomeBenefit2", "welcomeBenefit3"].map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 backdrop-blur-sm"
                    >
                      <Heart className="h-4 w-4 text-tea-200" />
                      <span className="text-sm font-medium text-white">{t(`loyalty.${benefit}`)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-12">
                  <Link href="/account">
                    <Button
                      size="lg"
                      className="group h-14 rounded-full bg-white px-10 text-base font-semibold text-tea-700 shadow-lg transition-all hover:bg-cream-50 hover:shadow-xl"
                    >
                      {t("loyalty.welcomeCta")}
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="heading-2 text-white">
                  {t("loyalty.title")}
                </h2>
                <p className="mt-4 text-lg text-tea-100">
                  {t("loyalty.subtitle")}
                </p>

                <div className="mt-10 flex flex-wrap justify-center gap-4">
                  {["benefit1", "benefit2", "benefit3"].map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 backdrop-blur-sm"
                    >
                      <Sparkles className="h-4 w-4 text-tea-200" />
                      <span className="text-sm font-medium text-white">{t(`loyalty.${benefit}`)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-12">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="group h-14 rounded-full bg-white px-10 text-base font-semibold text-tea-700 shadow-lg transition-all hover:bg-cream-50 hover:shadow-xl"
                    >
                      {t("loyalty.cta")}
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Reviews Section - Static content */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center">
            <h2 className="heading-2 text-bordeaux-800">
              {t("reviews.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("reviews.subtitle")}
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-3xl border border-cream-200 bg-gradient-to-b from-cream-50 to-white p-8"
              >
                <div className="flex gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-tea-400 text-tea-400" />
                  ))}
                </div>
                <p className="mt-6 text-lg leading-relaxed text-tea-800">
                  "{review.comment}"
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tea-100 font-serif text-lg font-medium text-tea-600">
                    {review.avatar}
                  </div>
                  <span className="font-medium text-tea-900">{review.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-cream-100 to-cream-200 shadow-soft lg:aspect-auto lg:h-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto h-16 w-16 text-tea-400" />
                  <p className="mt-4 font-medium text-tea-600">Sint-Niklaasstraat 36</p>
                  <p className="text-muted-foreground">9000 Gent</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="heading-2 text-bordeaux-800">{t("location.title")}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("location.subtitle")}</p>

              <div className="mt-10 flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-tea-100">
                  <MapPin className="h-6 w-6 text-tea-600" />
                </div>
                <div>
                  <h3 className="font-medium text-tea-900">Adres</h3>
                  <p className="mt-1 text-muted-foreground">{t("location.address")}</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-medium text-tea-900">{t("location.hours")}</h3>
                <div className="mt-4 grid gap-2">
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                    const hours = (storeSettings?.openingHours as Record<string, { open: string; close: string }> | undefined)?.[day];
                    return (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t(`location.${day}`)}</span>
                        <span className="font-medium text-tea-900">
                          {hours ? `${hours.open} - ${hours.close}` : "11:00 - 20:00"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-10">
                <Button
                  variant="outline"
                  className="rounded-full border-2 border-tea-200 px-6 font-medium transition-all hover:border-tea-300 hover:bg-tea-50"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  {t("location.directions")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding-sm bg-gradient-to-b from-cream-50 to-cream-100">
        <div className="container-custom">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="heading-2 text-bordeaux-800">{t("cta.title")}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("cta.subtitle")}</p>
            <div className="mt-10">
              <Link href="/menu">
                <Button
                  size="lg"
                  className="btn-premium group h-14 rounded-full bg-tea-600 px-10 text-base font-medium shadow-glow transition-all hover:bg-tea-700 hover:shadow-lg"
                >
                  {t("cta.button")}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
