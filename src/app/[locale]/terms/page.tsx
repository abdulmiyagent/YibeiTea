"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ShoppingBag, CreditCard, AlertCircle, Scale, Award, Shield, Gavel, Mail } from "lucide-react";

export default function TermsPage() {
  const locale = useLocale();
  const isNL = locale === "nl";

  return (
    <div className="section-padding">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {isNL ? "Terug naar home" : "Back to home"}
              </Button>
            </Link>
            <h1 className="heading-1">{isNL ? "Algemene Voorwaarden" : "Terms of Service"}</h1>
            <p className="mt-2 text-muted-foreground">
              {isNL ? "Laatst bijgewerkt: Januari 2026" : "Last updated: January 2026"}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-tea max-w-none">
            {/* General */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <FileText className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Algemeen" : "General"}</h2>
              </div>
              <p className="text-muted-foreground">
                {isNL
                  ? "Deze algemene voorwaarden zijn van toepassing op alle bestellingen geplaatst via de website van Yibei Tea. Door een bestelling te plaatsen, gaat u akkoord met deze voorwaarden."
                  : "These terms and conditions apply to all orders placed through the Yibei Tea website. By placing an order, you agree to these terms."}
              </p>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm mt-4">
                <p className="font-semibold">{isNL ? "Bedrijfsgegevens" : "Company details"}</p>
                <p className="mt-2 font-medium">Idris & Adam BV</p>
                <p>h/a Yibei Tea</p>
                <p>Sint-Niklaasstraat 36</p>
                <p>9000 Gent, België</p>
                <p className="mt-2">KBO/CBE: 0786.830.346</p>
                <p>BTW/VAT: BE0786.830.346</p>
              </div>
            </section>

            {/* Orders */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <ShoppingBag className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Bestellingen" : "Orders"}</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>
                  {isNL
                    ? "Alle bestellingen zijn uitsluitend voor afhaling in onze winkel."
                    : "All orders are for pickup only at our store."}
                </li>
                <li>
                  {isNL
                    ? "U ontvangt een bevestigingsmail met uw bestelnummer na betaling."
                    : "You will receive a confirmation email with your order number after payment."}
                </li>
                <li>
                  {isNL
                    ? "Bestellingen dienen afgehaald te worden op het gekozen tijdstip."
                    : "Orders must be picked up at the selected time."}
                </li>
                <li>
                  {isNL
                    ? "Niet-afgehaalde bestellingen worden na 30 minuten geannuleerd zonder restitutie."
                    : "Orders not picked up within 30 minutes will be cancelled without refund."}
                </li>
                <li>
                  {isNL
                    ? "Wijzigingen aan bestellingen zijn niet mogelijk na betaling."
                    : "Changes to orders are not possible after payment."}
                </li>
              </ul>
            </section>

            {/* Payments */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <CreditCard className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Betaling" : "Payment"}</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>
                  {isNL
                    ? "Alle prijzen zijn in euro's en inclusief BTW."
                    : "All prices are in euros and include VAT."}
                </li>
                <li>
                  {isNL
                    ? "Betaling geschiedt vooraf via Bancontact, iDEAL, creditcard of PayPal."
                    : "Payment is made in advance via Bancontact, iDEAL, credit card, or PayPal."}
                </li>
                <li>
                  {isNL
                    ? "Betalingen worden veilig verwerkt via Mollie B.V. (PCI-DSS gecertificeerd)."
                    : "Payments are securely processed via Mollie B.V. (PCI-DSS certified)."}
                </li>
              </ul>
            </section>

            {/* Loyalty Program */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <Award className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Loyaliteitsprogramma" : "Loyalty Program"}</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>
                  {isNL
                    ? "Alleen geregistreerde gebruikers verdienen loyaliteitspunten."
                    : "Only registered users earn loyalty points."}
                </li>
                <li>
                  {isNL
                    ? "Punten worden toegekend na succesvolle betaling."
                    : "Points are awarded after successful payment."}
                </li>
                <li>
                  {isNL
                    ? "Punten kunnen worden ingewisseld voor beloningen volgens de actuele tarieven."
                    : "Points can be redeemed for rewards according to current rates."}
                </li>
                <li>
                  {isNL
                    ? "Yibei Tea behoudt zich het recht voor om het loyaliteitsprogramma te wijzigen."
                    : "Yibei Tea reserves the right to modify the loyalty program."}
                </li>
                <li>
                  {isNL
                    ? "Punten zijn niet overdraagbaar en niet inwisselbaar voor geld."
                    : "Points are not transferable and cannot be exchanged for cash."}
                </li>
              </ul>
            </section>

            {/* Cancellations */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <AlertCircle className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Annulering & Restitutie" : "Cancellation & Refunds"}</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>
                  {isNL
                    ? "Annulering is mogelijk tot 1 uur voor de geplande ophaaltijd."
                    : "Cancellation is possible up to 1 hour before the scheduled pickup time."}
                </li>
                <li>
                  {isNL
                    ? "Neem contact op met ons voor annuleringen via info@yibeitea.be."
                    : "Contact us for cancellations at info@yibeitea.be."}
                </li>
                <li>
                  {isNL
                    ? "Restitutie wordt binnen 5-10 werkdagen verwerkt via de oorspronkelijke betaalmethode."
                    : "Refunds will be processed within 5-10 business days via the original payment method."}
                </li>
                <li>
                  {isNL
                    ? "Bij productkwaliteitsproblemen, neem contact op en we lossen het op."
                    : "For product quality issues, contact us and we will resolve it."}
                </li>
              </ul>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm mt-4">
                <p className="font-semibold text-amber-800">{isNL ? "Let op" : "Note"}</p>
                <p className="text-amber-700 mt-1">
                  {isNL
                    ? "Aangezien het om op maat gemaakte voedingsproducten gaat (bubble tea met specifieke aanpassingen), is het herroepingsrecht van 14 dagen onder de Wet Marktpraktijken niet van toepassing (Art. VI.53, 4° WER)."
                    : "As these are custom-made food products (bubble tea with specific customizations), the 14-day withdrawal right under consumer law does not apply (Art. VI.53, 4° Belgian Economic Law Code)."}
                </p>
              </div>
            </section>

            {/* Allergens */}
            <section className="mb-8">
              <h2 className="heading-3">{isNL ? "Allergenen & Voedingsinformatie" : "Allergens & Nutritional Info"}</h2>
              <p className="text-sm text-muted-foreground">
                {isNL
                  ? "Onze producten kunnen allergenen bevatten, waaronder maar niet beperkt tot: melk, soja, en gluten. Raadpleeg de allergeninformatie op de productpagina's. Bij twijfel of ernstige allergieën, neem contact op met ons personeel voordat u bestelt."
                  : "Our products may contain allergens, including but not limited to: milk, soy, and gluten. Please check the allergen information on product pages. If in doubt or with severe allergies, please contact our staff before ordering."}
              </p>
            </section>

            {/* Liability */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <Scale className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Aansprakelijkheid" : "Liability"}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isNL
                  ? "Yibei Tea is niet aansprakelijk voor schade als gevolg van onjuiste informatie verstrekt door de klant, overmacht, of onvoorziene omstandigheden. Onze aansprakelijkheid is beperkt tot het orderbedrag. Dit doet geen afbreuk aan uw wettelijke rechten als consument, noch aan onze aansprakelijkheid voor opzet of grove nalatigheid."
                  : "Yibei Tea is not liable for damages resulting from incorrect information provided by the customer, force majeure, or unforeseen circumstances. Our liability is limited to the order amount. This does not affect your statutory rights as a consumer, nor our liability for intent or gross negligence."}
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <Shield className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Intellectueel Eigendom" : "Intellectual Property"}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isNL
                  ? "Alle inhoud op deze website, inclusief maar niet beperkt tot teksten, afbeeldingen, logo's en software, is eigendom van Idris & Adam BV h/a Yibei Tea en beschermd door auteursrecht."
                  : "All content on this website, including but not limited to texts, images, logos, and software, is the property of Idris & Adam BV t/a Yibei Tea and protected by copyright."}
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <Gavel className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Toepasselijk Recht & Geschillen" : "Governing Law & Disputes"}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isNL
                  ? "Op deze voorwaarden is Belgisch recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechtbank te Gent."
                  : "These terms are governed by Belgian law. Disputes will be submitted to the competent court in Ghent."}
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                <strong>Online Dispute Resolution (ODR):</strong>{" "}
                {isNL
                  ? "U kunt ook gebruik maken van het Online Dispute Resolution platform van de Europese Commissie:"
                  : "You can also use the European Commission's Online Dispute Resolution platform:"}{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-tea-600 hover:underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <Mail className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Contact" : "Contact"}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isNL ? "Vragen over deze voorwaarden?" : "Questions about these terms?"}
              </p>
              <p className="mt-2">
                <a href="mailto:info@yibeitea.be" className="text-tea-600 hover:underline">
                  info@yibeitea.be
                </a>
              </p>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm mt-4">
                <p className="font-medium">Idris & Adam BV</p>
                <p>h/a Yibei Tea</p>
                <p>Sint-Niklaasstraat 36</p>
                <p>9000 Gent, België</p>
              </div>
            </section>

            {/* Version */}
            <p className="text-xs text-muted-foreground text-center pt-4 border-t">
              Versie 4.0 — Januari 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
