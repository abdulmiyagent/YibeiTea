import type { Metadata } from "next";
import { MenuPageContent } from "@/components/pages/menu-page";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Bekijk ons volledige menu van bubble tea, milk tea, ijskoffie en meer. Filter op vegan of cafeïnevrije opties.",
};

export default function MenuPage() {
  return <MenuPageContent />;
}
