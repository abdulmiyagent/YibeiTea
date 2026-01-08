import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getAllProducts, getCategories, getAllToppings, getCustomizations } from "@/lib/server-data";
import { MenuPageClient } from "@/components/pages/menu-page-client";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Bekijk ons volledige menu van bubble tea, milk tea, ijskoffie en meer. Filter op vegan of cafeïnevrije opties.",
};

export default async function MenuPage() {
  const locale = (await getLocale()) as "nl" | "en";

  // Parallel server-side data fetching
  const [products, categories, toppings, customizations] = await Promise.all([
    getAllProducts(locale),
    getCategories(locale),
    getAllToppings(locale),
    getCustomizations(locale),
  ]);

  return (
    <MenuPageClient
      products={products}
      categories={categories}
      toppings={toppings}
      customizations={customizations}
      locale={locale}
    />
  );
}
