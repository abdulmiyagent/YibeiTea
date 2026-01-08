// Server Component - Fetches data server-side for fast LCP
import { getLocale } from "next-intl/server";
import { getFeaturedProducts, getCategories, getStoreSettings } from "@/lib/server-data";
import { HomePageClient } from "@/components/home/HomePageClient";

export default async function HomePage() {
  const locale = (await getLocale()) as "nl" | "en";

  // Parallel server-side data fetching
  const [featuredProducts, categories, storeSettings] = await Promise.all([
    getFeaturedProducts(locale, 8),
    getCategories(locale),
    getStoreSettings(),
  ]);

  return (
    <HomePageClient
      featuredProducts={featuredProducts}
      categories={categories}
      storeSettings={storeSettings}
      locale={locale}
    />
  );
}
