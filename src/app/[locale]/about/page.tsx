import type { Metadata } from "next";
import { AboutPageContent } from "@/components/pages/about-page";

export const metadata: Metadata = {
  title: "Over Ons",
  description:
    "Ontdek het verhaal van Yibei Tea. Authentieke bubble tea gemaakt met verse ingrediënten in het hart van Gent.",
};

export default function AboutPage() {
  return <AboutPageContent />;
}
