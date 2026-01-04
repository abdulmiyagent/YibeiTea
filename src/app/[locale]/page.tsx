"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
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
} from "lucide-react";

// Featured products data
const featuredProducts = [
  {
    id: "1",
    slug: "classic-taro",
    name: "Classic Taro",
    price: 5.5,
    category: "MILK_TEA",
    gradient: "from-taro-200 via-taro-100 to-cream-100",
    accent: "taro",
  },
  {
    id: "2",
    slug: "matcha-latte",
    name: "Matcha Latte",
    price: 5.5,
    category: "MILK_TEA",
    gradient: "from-matcha-200 via-matcha-100 to-cream-100",
    accent: "matcha",
  },
  {
    id: "3",
    slug: "brown-sugar-boba",
    name: "Brown Sugar Boba",
    price: 5.5,
    category: "BUBBLE_TEA",
    gradient: "from-tea-200 via-tea-100 to-cream-100",
    accent: "tea",
  },
  {
    id: "4",
    slug: "strawberry-ice",
    name: "Strawberry Ice Tea",
    price: 5.5,
    category: "ICED_TEA",
    gradient: "from-rose-200 via-rose-100 to-cream-100",
    accent: "rose",
  },
];

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

const categories = [
  { key: "bubbleTea", icon: Coffee, color: "tea" },
  { key: "milkTea", icon: Droplets, color: "cream" },
  { key: "icedTea", icon: Citrus, color: "matcha" },
  { key: "mojito", icon: GlassWater, color: "taro" },
];

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
  const heroRef = useRef<HTMLDivElement>(null);

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
                <span className="inline-flex items-center gap-2 rounded-full border border-tea-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-tea-700 shadow-soft backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  {tCommon("tagline")}
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

            {/* Right - Featured drink visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="relative mx-auto aspect-square max-w-lg">
                {/* Decorative rings */}
                <div className="absolute inset-0 animate-gentle-pulse rounded-full border-2 border-tea-200/50" />
                <div className="absolute inset-4 animate-gentle-pulse rounded-full border border-matcha-200/40" style={{ animationDelay: "0.5s" }} />
                <div className="absolute inset-8 animate-gentle-pulse rounded-full border border-taro-200/30" style={{ animationDelay: "1s" }} />

                {/* Center circle with gradient */}
                <div className="absolute inset-12 overflow-hidden rounded-full bg-gradient-to-br from-tea-100 via-cream-50 to-matcha-100 shadow-soft-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ y: [-5, 5, -5] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="text-[120px]"
                    >
                      🧋
                    </motion.div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-4 top-1/4 rounded-2xl bg-white p-4 shadow-soft"
                >
                  <span className="text-3xl">🍵</span>
                </motion.div>
                <motion.div
                  animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -left-4 bottom-1/4 rounded-2xl bg-white p-4 shadow-soft"
                >
                  <span className="text-3xl">🫧</span>
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

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {featuredProducts.map((product, index) => (
              <motion.div key={product.id} variants={scaleIn}>
                <Link href={`/menu/${product.slug}`}>
                  <div className="product-card group cursor-pointer overflow-hidden rounded-3xl border border-cream-200 bg-white">
                    <div className={`relative aspect-square overflow-hidden bg-gradient-to-br ${product.gradient}`}>
                      <div className="product-image absolute inset-0 flex items-center justify-center">
                        <span className="text-8xl drop-shadow-lg">🧋</span>
                      </div>
                      {/* Price tag */}
                      <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-tea-700 shadow-sm backdrop-blur-sm">
                        €{product.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-serif text-lg font-medium text-tea-900 transition-colors group-hover:text-tea-600">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.category.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

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
                    Lees Meer
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

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.div key={cat.key} variants={scaleIn}>
                  <Link href={`/menu?category=${cat.key}`}>
                    <div className="group cursor-pointer rounded-3xl border border-cream-200 bg-gradient-to-b from-cream-50 to-white p-8 text-center transition-all duration-300 hover:border-tea-200 hover:shadow-soft">
                      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-${cat.color}-100 transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className={`h-8 w-8 text-${cat.color}-600`} />
                      </div>
                      <h3 className="mt-6 font-serif text-xl font-medium text-tea-900">
                        {t(`categories.${cat.key}`)}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t(`categories.${cat.key}Desc`)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
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
                        {day === "sunday" ? "12:00 - 19:00" : day === "friday" || day === "saturday" ? "11:00 - 21:00" : "11:00 - 20:00"}
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
