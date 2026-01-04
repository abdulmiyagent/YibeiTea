"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const t = useTranslations("home.location");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitted(true);
    setIsSubmitting(false);
  };

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
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
              Contact
            </h1>
            <p className="text-lg text-muted-foreground">
              Heb je een vraag of suggestie? Neem gerust contact met ons op!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container-custom">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {submitted ? (
                <div className="rounded-2xl bg-tea-50 p-8 text-center">
                  <div className="mb-4 text-5xl">✅</div>
                  <h3 className="mb-2 text-xl font-semibold">
                    Bericht verzonden!
                  </h3>
                  <p className="text-muted-foreground">
                    Bedankt voor je bericht. We nemen zo snel mogelijk contact
                    met je op.
                  </p>
                  <Button
                    variant="tea"
                    className="mt-6"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", subject: "", message: "" });
                    }}
                  >
                    Nieuw bericht
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Naam</Label>
                      <Input
                        id="name"
                        placeholder="Je naam"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="je@email.be"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Onderwerp</Label>
                    <Input
                      id="subject"
                      placeholder="Waar gaat je bericht over?"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Bericht</Label>
                    <Textarea
                      id="message"
                      placeholder="Je bericht..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="tea"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Verzenden..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Verstuur bericht
                      </>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h2 className="mb-6 text-2xl font-bold">Bezoek ons</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-tea-100 p-3">
                      <MapPin className="h-5 w-5 text-tea-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Adres</h3>
                      <p className="text-muted-foreground">
                        Brabantdam 59
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
                      <h3 className="font-semibold">{t("hours")}</h3>
                      <div className="text-sm text-muted-foreground">
                        <p>Ma - Do: 11:00 - 20:00</p>
                        <p>Vr - Za: 11:00 - 21:00</p>
                        <p>Zo: 12:00 - 19:00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
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
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
