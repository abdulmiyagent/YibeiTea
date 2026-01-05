import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n/request";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
  title: {
    default: "Yibei Tea - Premium Bubble Tea in Gent",
    template: "%s | Yibei Tea",
  },
  description:
    "Ontdek de beste bubble tea in Gent. Vers bereid met premium ingrediënten. Bestel online en haal af!",
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
  ],
  openGraph: {
    type: "website",
    locale: "nl_BE",
    alternateLocale: "en_GB",
    siteName: "Yibei Tea",
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
      </body>
    </html>
  );
}
