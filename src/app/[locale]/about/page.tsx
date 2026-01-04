"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Mail } from "lucide-react";

export default function AboutPage() {
  const t = useTranslations("home");
  const tLocation = useTranslations("home.location");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-tea-50 to-background py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-tea-100 px-4 py-1.5 text-sm font-medium text-tea-700">
              {t("story.label")}
            </span>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
              {t("story.title")}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid gap-12 md:grid-cols-2"
            >
              {/* Image */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-tea-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/images/logo.png"
                    alt="Yibei Tea"
                    className="h-32 w-auto opacity-50"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col justify-center">
                <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                  {t("story.description")}
                </p>

                {/* Highlights */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-tea-600">
                      {t("story.highlight1.value")}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {t("story.highlight1.label")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-tea-600">
                      {t("story.highlight2.value")}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {t("story.highlight2.label")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-tea-600">
                      {t("story.highlight3.value")}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {t("story.highlight3.label")}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="bg-muted/30 py-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">{t("whyUs.title")}</h2>
            <p className="text-muted-foreground">{t("whyUs.subtitle")}</p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {[
              { key: "quality", icon: "🍃" },
              { key: "fresh", icon: "✨" },
              { key: "customize", icon: "🎨" },
              { key: "loyalty", icon: "🎁" },
            ].map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="rounded-xl bg-background p-6 shadow-sm"
              >
                <div className="mb-4 text-4xl">{item.icon}</div>
                <h3 className="mb-2 text-lg font-semibold">
                  {t(`whyUs.${item.key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`whyUs.${item.key}.description`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">{tLocation("title")}</h2>
            <p className="text-muted-foreground">{tLocation("subtitle")}</p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
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
                  <h3 className="font-semibold">Adres</h3>
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
                  <h3 className="font-semibold">Telefoon</h3>
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
                  <h3 className="font-semibold">Email</h3>
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
                  <h3 className="font-semibold">{tLocation("hours")}</h3>
                  <div className="text-sm text-muted-foreground">
                    <p>Ma - Za: 11:00 - 20:00</p>
                    <p>Zo: 10:00 - 19:00</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Map Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="aspect-square overflow-hidden rounded-2xl bg-muted"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2508.4!2d3.7238!3d51.0516!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTHCsDAzJzA2LjAiTiAzwrA0MycyNi4yIkU!5e0!3m2!1sen!2sbe!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Yibei Tea Location"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
