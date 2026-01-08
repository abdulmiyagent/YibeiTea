"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Mail, Leaf, Sparkles, Heart, Quote } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

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

export function AboutPageContent() {
  const t = useTranslations("about");
  const tFooter = useTranslations("footer");

  const values = [
    { key: "authenticity", icon: Leaf, color: "matcha" },
    { key: "quality", icon: Sparkles, color: "tea" },
    { key: "warmth", icon: Heart, color: "taro" },
  ];

  const menuItems = [
    { key: "classic", icon: "🧋" },
    { key: "icedCoffee", icon: "☕" },
    { key: "icedTea", icon: "🍹" },
    { key: "warmCoffee", icon: "🫖" },
    { key: "sweets", icon: "🍰" },
    { key: "noodles", icon: "🍜" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-tea-50 to-background py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-tea-200/40 blur-3xl" />
          <div className="absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-matcha-200/30 blur-3xl" />
        </div>

        <div className="container-custom relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-tea-100 px-4 py-1.5 text-sm font-medium text-tea-700">
              {t("title")}
            </span>
            <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-bordeaux-800 md:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="text-xl text-tea-600 font-medium">
              {t("hero.subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl"
          >
            <p className="text-lg leading-relaxed text-muted-foreground text-center">
              {t("intro")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-gradient-to-b from-cream-50 to-white">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                className="mb-8 text-center font-serif text-3xl font-bold text-bordeaux-800"
              >
                {t("mission.title")}
              </motion.h2>

              <motion.div variants={fadeInUp} className="space-y-6">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t("mission.description")}
                </p>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t("mission.growth")}
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-12 text-center font-serif text-3xl font-bold text-bordeaux-800"
            >
              {t("values.title")}
            </motion.h2>

            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
              {values.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.key}
                    variants={fadeInUp}
                    className="group rounded-3xl bg-gradient-to-b from-cream-50 to-white p-8 text-center shadow-soft transition-all duration-300 hover:shadow-soft-lg"
                  >
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-${item.color}-100 transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`h-8 w-8 text-${item.color}-600`} />
                    </div>
                    <h3 className="mt-6 font-serif text-xl font-semibold text-bordeaux-800">
                      {t(`values.${item.key}.title`)}
                    </h3>
                    <p className="mt-3 text-muted-foreground">
                      {t(`values.${item.key}.description`)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Review Quote Section */}
      <section className="py-12 bg-tea-50/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <Quote className="mx-auto h-10 w-10 text-tea-300 mb-4" />
            <blockquote className="text-xl md:text-2xl font-serif text-tea-800 italic leading-relaxed">
              {t("review.quote")}
            </blockquote>
            <p className="mt-4 text-sm text-muted-foreground">
              — {t("review.source")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Menu Preview Section */}
      <section className="py-16 bg-gradient-to-b from-cream-50 to-cream-100">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mx-auto max-w-4xl"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 text-center font-serif text-3xl font-bold text-bordeaux-800"
            >
              {t("menu.title")}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mb-10 text-center text-lg text-muted-foreground"
            >
              {t("menu.description")}
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              {menuItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-medium text-tea-800">
                    {t(`menu.items.${item.key}`)}
                  </span>
                </div>
              ))}
            </motion.div>

            <motion.p
              variants={fadeInUp}
              className="mt-8 text-center text-muted-foreground"
            >
              {t("menu.closing")}
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-8 text-center">
              <Link href="/menu">
                <Button
                  size="lg"
                  className="rounded-full bg-tea-600 px-8 font-medium shadow-glow transition-all hover:bg-tea-700"
                >
                  {t("menu.viewMenu")}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Visit Section */}
      <section className="py-16">
        <div className="container-custom">
          <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2">
            {/* Visit Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-6 font-serif text-3xl font-bold text-bordeaux-800">
                {t("visit.title")}
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                {t("visit.description")}
              </p>
              <p className="text-xl font-serif font-medium text-tea-600 italic">
                {t("visit.tagline")}
              </p>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-tea-100 p-3">
                  <MapPin className="h-5 w-5 text-tea-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{tFooter("address")}</h3>
                  <p className="text-muted-foreground">
                    Sint-Niklaasstraat 36
                    <br />
                    9000 Gent, België
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-full bg-tea-100 p-3">
                  <Phone className="h-5 w-5 text-tea-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{tFooter("phone")}</h3>
                  <a
                    href="tel:+32484240611"
                    className="text-muted-foreground hover:text-tea-600"
                  >
                    0484/24.06.11
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-full bg-tea-100 p-3">
                  <Mail className="h-5 w-5 text-tea-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{tFooter("email")}</h3>
                  <a
                    href="mailto:info@yibeitea.be"
                    className="text-muted-foreground hover:text-tea-600"
                  >
                    info@yibeitea.be
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-full bg-tea-100 p-3">
                  <Clock className="h-5 w-5 text-tea-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{tFooter("hours")}</h3>
                  <div className="text-sm text-muted-foreground">
                    <p>{tFooter("weekdayHours")}</p>
                    <p>{tFooter("sundayHours")}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="pb-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl"
          >
            <div className="aspect-video overflow-hidden rounded-3xl bg-muted shadow-soft">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2508.5!2d3.7205!3d51.0538!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c371b12c3b8c9f%3A0x3f1c7c3e7a9c1234!2sSint-Niklaasstraat%2036%2C%209000%20Gent!5e0!3m2!1snl!2sbe!4v1704672000000!5m2!1snl!2sbe"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Yibei Tea Location"
              />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
