"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc";
import { useCartStore } from "@/stores/cart-store";
import {
  Star,
  Leaf,
  Clock,
  Sparkles,
  Gift,
  ArrowRight,
  ArrowDown,
  MapPin,
  Phone,
  ChevronRight,
  Coffee,
  Droplets,
  Citrus,
  GlassWater,
  Loader2,
  ShoppingCart,
  Check,
  Heart,
} from "lucide-react";
import { ProductQuickCustomize } from "@/components/products/product-quick-customize";

// Gradient mappings for categories
const categoryGradients: Record<string, string> = {
  "brown-sugar": "from-amber-200 via-amber-100 to-cream-100",
  "milk-tea": "from-taro-200 via-taro-100 to-cream-100",
  "cream-cheese": "from-cream-200 via-cream-100 to-white",
  "iced-coffee": "from-tea-200 via-cream-100 to-cream-50",
  "hot-coffee": "from-tea-300 via-tea-100 to-cream-100",
  "ice-tea": "from-matcha-200 via-matcha-100 to-cream-100",
  "mojito": "from-sky-200 via-sky-100 to-cream-100",
  "kids-star": "from-rose-200 via-rose-100 to-cream-100",
  "latte-special": "from-taro-200 via-cream-100 to-cream-50",
  "frappucchino": "from-tea-200 via-taro-100 to-cream-100",
};

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

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function HomePage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale() as "nl" | "en";
  const heroRef = useRef<HTMLDivElement>(null);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const addItem = useCartStore((state) => state.addItem);
  const { data: session } = useSession();

  // Fetch featured products from database
  const { data: featuredProducts, isLoading: productsLoading } = api.products.getFeatured.useQuery({
    locale,
    limit: 8,
  });

  // Fetch categories from database
  const { data: categories, isLoading: categoriesLoading } = api.categories.getAll.useQuery({
    locale,
  });

  // Fetch user's favorites (only if logged in)
  const { data: userFavorites, isLoading: favoritesLoading } = api.users.getFavorites.useQuery(
    { locale },
    { enabled: !!session?.user }
  );

  const handleAddToCart = (
    product: { id: string; slug: string; price: unknown; imageUrl: string | null; translations: Array<{ name: string }> },
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const translation = product.translations[0];

    addItem({
      productId: product.id,
      name: translation?.name || product.slug,
      price: Number(product.price),
      quantity: 1,
      imageUrl: product.imageUrl || undefined,
    });

    // Show added feedback
    setAddedProducts((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedProducts((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

  return (
    <>
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen overflow-hidden bg-gradient-to-b from-cream-100 via-cream-50 to-background"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-tea-200/40 blur-3xl" />
          <div className="absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-matcha-200/30 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-taro-200/30 blur-3xl" />

          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-30 pattern-dots" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="container-custom relative flex min-h-screen flex-col justify-center py-20"
        >
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="relative z-10 text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-3 rounded-full border border-tea-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-tea-700 shadow-soft backdrop-blur-sm">
                  {/* Animated Boba Pearls - Logo colors */}
                  <span className="relative flex h-5 w-8 items-center justify-center">
                    <motion.span
                      animate={{ y: [-2, 2, -2], scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-0 h-2.5 w-2.5 rounded-full shadow-sm"
                      style={{ background: "linear-gradient(135deg, #8B2635 0%, #6B1D2A 100%)" }}
                    />
                    <motion.span
                      animate={{ y: [2, -2, 2], scale: [1.1, 1, 1.1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                      className="absolute left-2.5 top-0 h-2 w-2 rounded-full shadow-sm"
                      style={{ background: "linear-gradient(135deg, #FF9900 0%, #E68A00 100%)" }}
                    />
                    <motion.span
                      animate={{ y: [-1, 3, -1], scale: [1, 1.15, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                      className="absolute right-0 h-2.5 w-2.5 rounded-full shadow-sm"
                      style={{ background: "linear-gradient(135deg, #8B2635 0%, #6B1D2A 100%)" }}
                    />
                  </span>
                  {tCommon("tagline")}
                  {/* Small tea leaf accent */}
                  <motion.span
                    animate={{ rotate: [-5, 5, -5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    style={{ color: "#8B2635" }}
                  >
                    🍃
                  </motion.span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUp}
                className="mt-8 font-serif text-4xl font-medium leading-tight tracking-tight text-tea-900 sm:text-5xl md:text-6xl lg:text-7xl"
              >
                {t("hero.title")}
                <span className="mt-2 block text-gradient">
                  {t("hero.titleAccent")}
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeInUp}
                className="mt-6 text-lg text-muted-foreground md:text-xl lg:max-w-lg"
              >
                {t("hero.subtitle")}
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeInUp}
                className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
              >
                <Link href="/menu">
                  <Button
                    size="lg"
                    className="btn-premium group h-14 gap-2 rounded-full bg-tea-600 px-8 text-base font-medium text-white shadow-glow transition-all hover:bg-tea-700 hover:shadow-lg"
                  >
                    {t("hero.cta")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/menu">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 rounded-full border-2 border-tea-200 bg-white/50 px-8 text-base font-medium backdrop-blur-sm transition-all hover:border-tea-300 hover:bg-white"
                  >
                    {t("hero.orderNow")}
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right - Yibei Tea Bubble Tea Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="relative mx-auto aspect-square max-w-lg">
                {/* Outer glow rings - Logo Colors */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{ background: "radial-gradient(circle, rgba(139, 38, 53, 0.25) 0%, transparent 50%, rgba(255, 153, 0, 0.2) 100%)" }}
                />

                {/* Stylized Bubble Tea Cup - Logo Colors with Gradients */}
                <div className="absolute inset-8 flex items-center justify-center">
                  <div className="relative">
                    {/* Cup body */}
                    <motion.div
                      animate={{ y: [-3, 3, -3] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative"
                    >
                      {/* Lid/dome with gradient */}
                      <div
                        className="absolute -top-6 left-1/2 h-12 w-52 -translate-x-1/2 rounded-t-full shadow-md"
                        style={{ background: "linear-gradient(180deg, #F5E6D3 0%, #E8D5C4 50%, #DBC4B0 100%)" }}
                      />
                      <div
                        className="absolute -top-2 left-1/2 h-4 w-56 -translate-x-1/2 rounded-full shadow-sm"
                        style={{ background: "linear-gradient(90deg, #8B2635 0%, #A03040 50%, #8B2635 100%)" }}
                      />

                      {/* Straw - Orange gradient */}
                      <motion.div
                        animate={{ rotate: [-2, 2, -2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-20 left-1/2 z-20 h-28 w-4 -translate-x-1/2 rounded-full shadow-md"
                        style={{ background: "linear-gradient(180deg, #FFB340 0%, #FF9900 30%, #E68A00 70%, #CC7A00 100%)", transformOrigin: "bottom center" }}
                      />

                      {/* Main cup with beautiful gradient */}
                      <div
                        className="relative h-64 w-48 overflow-hidden rounded-b-[3rem] shadow-2xl"
                        style={{
                          clipPath: "polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)",
                          background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,230,211,0.9) 50%, rgba(232,213,196,0.85) 100%)"
                        }}
                      >
                        {/* Tea liquid gradient - Bordeaux to Orange blend */}
                        <div
                          className="absolute inset-x-2 bottom-0 top-8 rounded-b-[2.5rem]"
                          style={{
                            background: "linear-gradient(180deg, rgba(160, 48, 64, 0.6) 0%, rgba(139, 38, 53, 0.75) 30%, rgba(139, 38, 53, 0.85) 60%, rgba(107, 29, 42, 0.95) 100%)"
                          }}
                        />

                        {/* Animated Boba Pearls inside - Orange gradient */}
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute bottom-8 left-6 h-6 w-6 rounded-full shadow-lg"
                          style={{ background: "radial-gradient(circle at 30% 30%, #FFD080 0%, #FF9900 40%, #CC7A00 100%)" }}
                        />
                        <motion.div
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                          className="absolute bottom-6 left-14 h-5 w-5 rounded-full shadow-lg"
                          style={{ background: "radial-gradient(circle at 30% 30%, #FFE0A0 0%, #FFB340 40%, #FF9900 100%)" }}
                        />
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                          className="absolute bottom-10 right-8 h-6 w-6 rounded-full shadow-lg"
                          style={{ background: "radial-gradient(circle at 30% 30%, #FFD080 0%, #FF9900 40%, #CC7A00 100%)" }}
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
                          className="absolute bottom-4 right-14 h-5 w-5 rounded-full shadow-lg"
                          style={{ background: "radial-gradient(circle at 30% 30%, #FFE0A0 0%, #FFB340 40%, #FF9900 100%)" }}
                        />
                        <motion.div
                          animate={{ y: [0, -7, 0] }}
                          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                          className="absolute bottom-12 left-10 h-4 w-4 rounded-full shadow-lg"
                          style={{ background: "radial-gradient(circle at 30% 30%, #FFD080 0%, #FF9900 40%, #CC7A00 100%)" }}
                        />

                        {/* Multiple shine effects for glass look */}
                        <div className="absolute left-2 top-10 h-32 w-6 rounded-full bg-white/40 blur-sm" />
                        <div className="absolute left-4 top-16 h-20 w-3 rounded-full bg-white/25 blur-xs" />
                        <div className="absolute right-4 top-12 h-16 w-2 rounded-full bg-white/20 blur-sm" />
                      </div>

                      {/* Cup bottom rim gradient */}
                      <div
                        className="absolute -bottom-1 left-1/2 h-3 w-32 -translate-x-1/2 rounded-full"
                        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(139, 38, 53, 0.3) 50%, transparent 100%)" }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Floating Boba Pearls around - Logo Colors */}
                <motion.div
                  animate={{ y: [-15, 15, -15], x: [-5, 5, -5], rotate: [0, 360] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-2 top-20 h-10 w-10 rounded-full shadow-lg"
                  style={{ background: "linear-gradient(135deg, #8B2635 0%, #6B1D2A 100%)" }}
                />
                <motion.div
                  animate={{ y: [10, -15, 10], x: [5, -5, 5] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -left-4 top-32 h-8 w-8 rounded-full shadow-lg"
                  style={{ background: "linear-gradient(135deg, #FF9900 0%, #E68A00 100%)" }}
                />
                <motion.div
                  animate={{ y: [-10, 20, -10], rotate: [0, -360] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-24 right-4 h-7 w-7 rounded-full shadow-lg"
                  style={{ background: "linear-gradient(135deg, #8B2635 0%, #6B1D2A 100%)" }}
                />
                <motion.div
                  animate={{ y: [15, -10, 15], x: [-3, 3, -3] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute bottom-32 -left-6 h-6 w-6 rounded-full shadow-lg"
                  style={{ background: "linear-gradient(135deg, #FF9900 0%, #CC7A00 100%)" }}
                />

                {/* Floating icons - slow irregular crossing movement */}
                <motion.div
                  animate={{
                    y: [-60, 80, -30, 100, -80, 40, -60],
                    x: [30, -90, 70, -40, 80, -70, 30],
                    rotate: [0, 45, -30, 90, -60, 120, 0],
                    scale: [1, 1.15, 0.95, 1.1, 1, 1.2, 1]
                  }}
                  transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-1/4 top-1/4"
                >
                  <span className="text-4xl drop-shadow-lg">🧋</span>
                </motion.div>
                <motion.div
                  animate={{
                    y: [70, -50, 30, -90, 60, -40, 70],
                    x: [-60, 80, -30, 100, -80, 50, -60],
                    rotate: [0, -60, 45, -90, 30, -120, 0],
                    scale: [1.1, 0.9, 1.2, 1, 1.15, 0.95, 1.1]
                  }}
                  transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute right-1/4 top-1/3"
                >
                  <span className="text-3xl drop-shadow-lg">🍃</span>
                </motion.div>
                <motion.div
                  animate={{
                    y: [-50, 70, -80, 50, -30, 90, -50],
                    x: [80, -60, 40, -90, 70, -50, 80],
                    rotate: [0, 75, -45, 100, -80, 60, 0],
                    scale: [1, 1.25, 0.9, 1.1, 1, 1.15, 1]
                  }}
                  transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4 }}
                  className="absolute left-1/3 bottom-1/4"
                >
                  <span className="text-3xl drop-shadow-lg">✨</span>
                </motion.div>
                <motion.div
                  animate={{
                    y: [50, -80, 60, -40, 90, -70, 50],
                    x: [-80, 50, -100, 70, -50, 90, -80],
                    rotate: [0, -50, 80, -100, 45, -75, 0],
                    scale: [1.1, 1, 1.2, 0.9, 1.15, 1, 1.1]
                  }}
                  transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 6 }}
                  className="absolute right-1/3 bottom-1/3"
                >
                  {/* Custom Coffee Bean SVG */}
                  <svg width="32" height="32" viewBox="0 0 32 32" className="drop-shadow-lg">
                    <ellipse cx="16" cy="16" rx="10" ry="14" fill="url(#coffeeBeanGradient)" />
                    <path d="M16 4 Q12 16 16 28" stroke="#3D1F0D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="coffeeBeanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5A2B" />
                        <stop offset="50%" stopColor="#5D3A1A" />
                        <stop offset="100%" stopColor="#3D1F0D" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2 text-sm text-muted-foreground"
            >
              <span className="text-xs uppercase tracking-widest">{t("hero.scrollHint")}</span>
              <ArrowDown className="h-4 w-4" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Featured Products */}
      <section className="section-padding relative overflow-hidden bg-white">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.span variants={fadeInUp} className="decorative-line text-sm font-medium uppercase tracking-widest text-tea-600">
              {t("featured.title")}
            </motion.span>
            <motion.h2 variants={fadeInUp} className="heading-2 mt-4 text-tea-900">
              {t("featured.subtitle")}
            </motion.h2>
          </motion.div>

          {productsLoading ? (
            <div className="mt-16 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {(featuredProducts ?? []).map((product) => {
                const translation = product.translations[0];
                const categorySlug = product.category?.slug || "";
                const gradient = categoryGradients[categorySlug] || "from-tea-200 via-cream-100 to-cream-50";
                const categoryTranslation = product.category?.translations[0];

                const isAdded = addedProducts.has(product.id);

                return (
                  <motion.div key={product.id} variants={scaleIn}>
                    <Link href={`/menu/${product.slug}`}>
                      <div className="product-card group cursor-pointer overflow-hidden rounded-3xl border border-cream-200 bg-white">
                        <div className={`relative aspect-square overflow-hidden bg-gradient-to-br ${gradient}`}>
                          <div className="product-image absolute inset-0 flex items-center justify-center p-4">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={translation?.name || product.slug}
                                className="h-full w-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
                              />
                            ) : (
                              <span className="text-7xl transition-transform group-hover:scale-110">🧋</span>
                            )}
                          </div>
                          {/* Price tag */}
                          <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-tea-700 shadow-sm backdrop-blur-sm">
                            €{Number(product.price).toFixed(2)}
                          </div>
                        </div>
                        <div className="p-5">
                          <div>
                            <h3 className="font-serif text-lg font-medium text-tea-900 transition-colors group-hover:text-tea-600">
                              {translation?.name || product.slug}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {categoryTranslation?.name || categorySlug}
                            </p>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => handleAddToCart(product, e)}
                              className={`flex-1 rounded-full transition-all duration-300 ${
                                isAdded
                                  ? "bg-matcha-500 hover:bg-matcha-600"
                                  : "bg-tea-600 hover:bg-tea-700"
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="mr-1 h-4 w-4" />
                                  {t("featured.added")}
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="mr-1 h-4 w-4" />
                                  {t("featured.addToCart")}
                                </>
                              )}
                            </Button>
                            <ProductQuickCustomize
                              product={product}
                              showTriggerText={false}
                              triggerClassName="rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
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
          </motion.div>
        </div>
      </section>

      {/* My Favorites Section - Only shown when logged in */}
      {session?.user && (
        <section className="section-padding relative overflow-hidden bg-gradient-to-b from-cream-50 to-white">
          <div className="container-custom">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center"
            >
              <motion.div variants={fadeInUp} className="flex items-center justify-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                <span className="decorative-line text-sm font-medium uppercase tracking-widest text-tea-600">
                  {t("myFavorites.title")}
                </span>
              </motion.div>
              <motion.h2 variants={fadeInUp} className="heading-2 mt-4 text-tea-900">
                {t("myFavorites.subtitle")}
              </motion.h2>
            </motion.div>

            {favoritesLoading ? (
              <div className="mt-16 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
              </div>
            ) : userFavorites && userFavorites.length > 0 ? (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
              >
                {userFavorites.slice(0, 4).map((product) => {
                  const translation = product.translations[0];
                  const categorySlug = product.category?.slug || "";
                  const gradient = categoryGradients[categorySlug] || "from-tea-200 via-cream-100 to-cream-50";
                  const categoryTranslation = product.category?.translations[0];
                  const isAdded = addedProducts.has(product.id);

                  return (
                    <motion.div key={product.id} variants={scaleIn}>
                      <Link href={`/menu/${product.slug}`}>
                        <div className="product-card group cursor-pointer overflow-hidden rounded-3xl border border-rose-200 bg-white">
                          <div className={`relative aspect-square overflow-hidden bg-gradient-to-br ${gradient}`}>
                            <div className="product-image absolute inset-0 flex items-center justify-center p-4">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={translation?.name || product.slug}
                                  className="h-full w-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
                                />
                              ) : (
                                <span className="text-7xl transition-transform group-hover:scale-110">🧋</span>
                              )}
                            </div>
                            {/* Favorite heart icon */}
                            <div className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm backdrop-blur-sm">
                              <Heart className="h-4 w-4 fill-current" />
                            </div>
                            {/* Price tag */}
                            <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-tea-700 shadow-sm backdrop-blur-sm">
                              €{Number(product.price).toFixed(2)}
                            </div>
                          </div>
                          <div className="p-5">
                            <div>
                              <h3 className="font-serif text-lg font-medium text-tea-900 transition-colors group-hover:text-tea-600">
                                {translation?.name || product.slug}
                              </h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {categoryTranslation?.name || categorySlug}
                              </p>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => handleAddToCart(product, e)}
                                className={`flex-1 rounded-full transition-all duration-300 ${
                                  isAdded
                                    ? "bg-matcha-500 hover:bg-matcha-600"
                                    : "bg-tea-600 hover:bg-tea-700"
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="mr-1 h-4 w-4" />
                                    {t("featured.added")}
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="mr-1 h-4 w-4" />
                                    {t("featured.addToCart")}
                                  </>
                                )}
                              </Button>
                              <ProductQuickCustomize
                                product={product}
                                showTriggerText={false}
                                triggerClassName="rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-16 text-center"
              >
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
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Our Story Section */}
      <section className="section-padding relative overflow-hidden bg-gradient-to-b from-cream-50 to-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-50 pattern-dots" />

        <div className="container-custom relative">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Image side */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-tea-100 via-cream-100 to-matcha-100 shadow-soft-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="text-[180px]"
                  >
                    🍃
                  </motion.div>
                </div>
              </div>

              {/* Floating stats card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-6 -right-6 rounded-2xl bg-white p-6 shadow-soft-lg lg:p-8"
              >
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="font-serif text-2xl font-medium text-tea-600 lg:text-3xl">
                      {t("story.highlight1.value")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground lg:text-sm">
                      {t("story.highlight1.label")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-serif text-2xl font-medium text-matcha-600 lg:text-3xl">
                      {t("story.highlight2.value")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground lg:text-sm">
                      {t("story.highlight2.label")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-serif text-2xl font-medium text-taro-600 lg:text-3xl">
                      {t("story.highlight3.value")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground lg:text-sm">
                      {t("story.highlight3.label")}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Content side */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.span variants={fadeInUp} className="text-sm font-medium uppercase tracking-widest text-tea-600">
                {t("story.label")}
              </motion.span>
              <motion.h2 variants={fadeInUp} className="heading-1 mt-4 text-tea-900">
                {t("story.title")}
              </motion.h2>
              <motion.p variants={fadeInUp} className="mt-6 text-lg leading-relaxed text-muted-foreground">
                {t("story.description")}
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-10">
                <Link href="/about">
                  <Button
                    size="lg"
                    className="group rounded-full bg-tea-600 px-8 font-medium shadow-glow transition-all hover:bg-tea-700"
                  >
                    {t("story.readMore")}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2 variants={fadeInUp} className="heading-2 text-tea-900">
              {t("categories.title")}
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg text-muted-foreground">
              {t("categories.subtitle")}
            </motion.p>
          </motion.div>

          {categoriesLoading ? (
            <div className="mt-16 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {(categories ?? []).slice(0, 8).map((cat) => {
                const translation = cat.translations[0];
                const iconConfig = categoryIcons[cat.slug] || { icon: Coffee, color: "tea" };
                const Icon = iconConfig.icon;
                const color = iconConfig.color;

                return (
                  <motion.div key={cat.id} variants={scaleIn}>
                    <Link href={`/menu?category=${cat.slug}`}>
                      <div className="group cursor-pointer rounded-3xl border border-cream-200 bg-gradient-to-b from-cream-50 to-white p-8 text-center transition-all duration-300 hover:border-tea-200 hover:shadow-soft">
                        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-${color}-100 transition-transform duration-300 group-hover:scale-110`}>
                          <Icon className={`h-8 w-8 text-${color}-600`} />
                        </div>
                        <h3 className="mt-6 font-serif text-xl font-medium text-tea-900">
                          {translation?.name || cat.slug}
                        </h3>
                        {translation?.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {translation.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Why Us Section */}
      <section className="section-padding bg-gradient-to-b from-cream-50 to-cream-100">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2 variants={fadeInUp} className="heading-2 text-tea-900">
              {t("whyUs.title")}
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg text-muted-foreground">
              {t("whyUs.subtitle")}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { icon: Leaf, key: "quality", color: "matcha" },
              { icon: Clock, key: "fresh", color: "tea" },
              { icon: Sparkles, key: "customize", color: "taro" },
              { icon: Gift, key: "loyalty", color: "tea" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.key}
                  variants={scaleIn}
                  className="group rounded-3xl bg-white p-8 shadow-soft transition-all duration-300 hover:shadow-soft-lg"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-${item.color}-100 transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`h-7 w-7 text-${item.color}-600`} />
                  </div>
                  <h3 className="mt-6 font-serif text-xl font-medium text-tea-900">
                    {t(`whyUs.${item.key}.title`)}
                  </h3>
                  <p className="mt-3 text-muted-foreground">
                    {t(`whyUs.${item.key}.description`)}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2 variants={fadeInUp} className="heading-2 text-tea-900">
              {t("reviews.title")}
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg text-muted-foreground">
              {t("reviews.subtitle")}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mt-16 grid gap-8 md:grid-cols-3"
          >
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                variants={scaleIn}
                className="rounded-3xl border border-cream-200 bg-gradient-to-b from-cream-50 to-white p-8"
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-tea-400 text-tea-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="mt-6 text-lg leading-relaxed text-tea-800">
                  "{review.comment}"
                </p>

                {/* Author */}
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tea-100 font-serif text-lg font-medium text-tea-600">
                    {review.avatar}
                  </div>
                  <span className="font-medium text-tea-900">{review.name}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Loyalty CTA Section */}
      <section className="section-padding relative overflow-hidden bg-gradient-to-br from-tea-600 via-tea-700 to-tea-800">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-tea-500/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-matcha-500/20 blur-3xl" />
        </div>

        <div className="container-custom relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.h2 variants={fadeInUp} className="heading-2 text-white">
              {t("loyalty.title")}
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg text-tea-100">
              {t("loyalty.subtitle")}
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-wrap justify-center gap-4"
            >
              {["benefit1", "benefit2", "benefit3"].map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 backdrop-blur-sm"
                >
                  <Sparkles className="h-4 w-4 text-tea-200" />
                  <span className="text-sm font-medium text-white">{t(`loyalty.${benefit}`)}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-12">
              <Link href="/register">
                <Button
                  size="lg"
                  className="group h-14 rounded-full bg-white px-10 text-base font-semibold text-tea-700 shadow-lg transition-all hover:bg-cream-50 hover:shadow-xl"
                >
                  {t("loyalty.cta")}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Location Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-12 lg:grid-cols-2 lg:gap-20"
          >
            {/* Map placeholder */}
            <motion.div
              variants={fadeInUp}
              className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-cream-100 to-cream-200 shadow-soft lg:aspect-auto lg:h-full"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto h-16 w-16 text-tea-400" />
                  <p className="mt-4 font-medium text-tea-600">Sint-Niklaasstraat 36</p>
                  <p className="text-muted-foreground">9000 Gent</p>
                </div>
              </div>
            </motion.div>

            {/* Info */}
            <motion.div variants={fadeInUp}>
              <h2 className="heading-2 text-tea-900">{t("location.title")}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("location.subtitle")}</p>

              {/* Address */}
              <div className="mt-10 flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-tea-100">
                  <MapPin className="h-6 w-6 text-tea-600" />
                </div>
                <div>
                  <h3 className="font-medium text-tea-900">Adres</h3>
                  <p className="mt-1 text-muted-foreground">{t("location.address")}</p>
                </div>
              </div>

              {/* Hours */}
              <div className="mt-8">
                <h3 className="font-medium text-tea-900">{t("location.hours")}</h3>
                <div className="mt-4 grid gap-2">
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t(`location.${day}`)}</span>
                      <span className="font-medium text-tea-900">
                        {day === "sunday" ? "10:00 - 19:00" : "11:00 - 20:00"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="mt-10">
                <Button
                  variant="outline"
                  className="rounded-full border-2 border-tea-200 px-6 font-medium transition-all hover:border-tea-300 hover:bg-tea-50"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  {t("location.directions")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding-sm bg-gradient-to-b from-cream-50 to-cream-100">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="heading-2 text-tea-900">{t("cta.title")}</h2>
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
          </motion.div>
        </div>
      </section>
    </>
  );
}
