import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n/request";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://yibeitea.be"),
  title: {
    default: "Yibei Tea - Premium Bubble Tea in Gent",
    template: "%s | Yibei Tea",
  },
  description:
    "Bestel verse, handgemaakte bubble tea online. Pas je drankje aan met suikerniveau, ijs en toppings. Afhalen in Gent. Loyaliteitspunten bij elke bestelling.",
  keywords: [
    "bubble tea",
    "boba",
    "milk tea",
    "Gent",
    "Ghent",
    "België",
    "Belgium",
    "taro",
    "matcha",
    "online bestellen",
    "afhalen",
    "tapioca",
  ],
  authors: [{ name: "Yibei Tea" }],
  creator: "Yibei Tea",
  openGraph: {
    type: "website",
    locale: "nl_BE",
    alternateLocale: "en_GB",
    url: "https://yibeitea.be",
    siteName: "Yibei Tea",
    title: "Yibei Tea - Premium Bubble Tea in Gent",
    description:
      "Bestel verse, handgemaakte bubble tea online. Pas je drankje aan en haal af in Gent.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Yibei Tea - Bubble Tea in Gent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yibei Tea - Premium Bubble Tea in Gent",
    description:
      "Bestel verse, handgemaakte bubble tea online. Afhalen in Gent.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
  modal: React.ReactNode; // Parallel route slot for intercepting routes
  params: { locale: string };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  modal,
  params: { locale },
}: RootLayoutProps) {
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${dmSans.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            {/* Parallel route slot for modal - rendered on top of content */}
            {modal}
          </Providers>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
