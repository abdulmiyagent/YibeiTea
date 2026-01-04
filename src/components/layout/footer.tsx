"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Instagram,
  MapPin,
  Phone,
  Clock,
  Mail,
} from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container-custom section-padding">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand & About */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <img
                src="/images/logo.png"
                alt="Yibei Tea"
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("tagline")}
            </p>
            <div className="flex space-x-4">
              <a
                href="https://instagram.com/yibeitea"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-tea-600"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://tiktok.com/@yibeitea"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-tea-600"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t("contact")}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  Sint-Niklaasstraat 36<br />
                  9000 Gent, België
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+32484240611" className="hover:text-tea-600">
                  0484/24.06.11
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@yibeitea.be" className="hover:text-tea-600">
                  info@yibeitea.be
                </a>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t("hours")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{t("weekdayHours")}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{t("sundayHours")}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t("newsletter.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("newsletter.description")}
            </p>
            <form className="flex space-x-2">
              <Input
                type="email"
                placeholder={t("newsletter.placeholder")}
                className="flex-1"
              />
              <Button type="submit" variant="tea" size="sm">
                {t("newsletter.subscribe")}
              </Button>
            </form>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between space-y-4 text-sm text-muted-foreground md:flex-row md:space-y-0">
          <p>{t("copyright", { year: currentYear })}</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-tea-600">
              {t("legal.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-tea-600">
              {t("legal.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
