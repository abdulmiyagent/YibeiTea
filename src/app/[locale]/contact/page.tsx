import type { Metadata } from "next";
import { ContactPageContent } from "@/components/pages/contact-page";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Bezoek ons op Sint-Niklaasstraat 36, 9000 Gent. Vragen? Neem contact op met Yibei Tea.",
};

export default function ContactPage() {
  return <ContactPageContent />;
}
