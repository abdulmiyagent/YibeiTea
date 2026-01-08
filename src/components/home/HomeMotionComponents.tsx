"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown } from "lucide-react";
import Image from "next/image";

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

interface HeroSectionProps {
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function HeroSection({ t, tCommon }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[auto] lg:min-h-screen overflow-hidden bg-gradient-to-b from-cream-100 via-cream-50 to-background"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-tea-200/40 blur-3xl" />
        <div className="absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-matcha-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-taro-200/30 blur-3xl" />
        <div className="absolute inset-0 opacity-30 pattern-dots" />
      </div>

      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="container-custom relative flex flex-col justify-center py-16 lg:min-h-screen lg:py-20"
      >
        <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-16">
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
                {/* Animated Boba Pearls */}
                <span className="relative flex h-5 w-8 items-center justify-center">
                  <motion.span
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-0 h-2.5 w-2.5 rounded-full shadow-sm will-change-transform"
                    style={{ background: "linear-gradient(135deg, #8B2635 0%, #6B1D2A 100%)" }}
                  />
                  <motion.span
                    animate={{ y: [2, -2, 2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute left-2.5 top-0 h-2 w-2 rounded-full shadow-sm will-change-transform"
                    style={{ background: "linear-gradient(135deg, #FF9900 0%, #E68A00 100%)" }}
                  />
                  <motion.span
                    animate={{ y: [-1, 3, -1] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute right-0 h-2.5 w-2.5 rounded-full shadow-sm will-change-transform"
                    style={{ background: "linear-gradient(135deg, #8B2635 0%, #6B1D2A 100%)" }}
                  />
                </span>
                {tCommon("tagline")}
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
              className="mt-8 font-serif text-4xl font-medium leading-tight tracking-tight text-bordeaux-800 sm:text-5xl md:text-6xl lg:text-7xl"
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

          {/* Right - Product Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative mx-auto max-w-[320px] sm:max-w-[400px] lg:max-w-lg">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-tea-200/30 via-transparent to-taro-200/30 blur-2xl" />

              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative will-change-transform"
              >
                <Image
                  src="/images/hero-drinks.jpg"
                  alt="Yibei Tea bubble tea collection"
                  width={600}
                  height={400}
                  className="relative z-10 w-full rounded-2xl shadow-2xl"
                  priority
                />
              </motion.div>

              {/* Floating decorative elements */}
              <motion.div
                animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 -top-4 hidden lg:block"
              >
                <span className="text-4xl drop-shadow-lg">🧋</span>
              </motion.div>
              <motion.div
                animate={{ y: [10, -10, 10], rotate: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-2 -left-4 hidden lg:block"
              >
                <span className="text-3xl drop-shadow-lg">✨</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden lg:block"
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
  );
}

// Default export for lazy loading
export default HeroSection;
