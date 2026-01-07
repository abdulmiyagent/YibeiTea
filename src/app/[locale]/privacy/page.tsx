"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Database, UserCheck, Mail, Globe, Scale, Clock } from "lucide-react";

export default function PrivacyPage() {
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
            <h1 className="heading-1">{isNL ? "Privacybeleid" : "Privacy Policy"}</h1>
            <p className="mt-2 text-muted-foreground">
              {isNL ? "Laatst bijgewerkt: Januari 2026" : "Last updated: January 2026"}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-tea max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <Shield className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Inleiding" : "Introduction"}</h2>
              </div>
              <p className="text-muted-foreground">
                {isNL
                  ? "Yibei Tea respecteert uw privacy en zet zich in voor de bescherming van uw persoonsgegevens. Dit privacybeleid informeert u over hoe wij omgaan met uw persoonsgegevens wanneer u onze website bezoekt en uw rechten met betrekking tot uw gegevens."
                  : "Yibei Tea respects your privacy and is committed to protecting your personal data. This privacy policy informs you about how we handle your personal data when you visit our website and your rights regarding your data."}
              </p>
            </section>

            {/* Data Controller */}
            <section className="mb-8">
              <h2 className="heading-3">{isNL ? "Verwerkingsverantwoordelijke" : "Data Controller"}</h2>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-semibold">Idris & Adam BV</p>
                <p>h/a Yibei Tea</p>
                <p>Sint-Niklaasstraat 36</p>
                <p>9000 Gent, België</p>
                <p className="mt-2">KBO/CBE: 0786.830.346</p>
                <p>BTW/VAT: BE0786.830.346</p>
                <p className="mt-2">
                  Email:{" "}
                  <a href="mailto:privacy@yibeitea.be" className="text-tea-600 hover:underline">
                    privacy@yibeitea.be
                  </a>
                </p>
              </div>
            </section>

            {/* Data We Collect */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <Database className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Gegevens die we verzamelen" : "Data We Collect"}</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-1">{isNL ? "Accountgegevens" : "Account Data"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isNL
                      ? "Naam, e-mailadres, telefoonnummer (optioneel), geboortedatum (optioneel), opgeslagen adressen"
                      : "Name, email address, phone number (optional), date of birth (optional), saved addresses"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{isNL ? "Bestelgegevens" : "Order Data"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isNL
                      ? "Bestelgeschiedenis, ophaaltijden, bestelaanpassingen"
                      : "Order history, pickup times, order customizations"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{isNL ? "Loyaliteitsgegevens" : "Loyalty Data"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isNL
                      ? "Verdiende en ingewisselde punten, loyaliteitsniveau"
                      : "Points earned and redeemed, loyalty tier"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{isNL ? "Technische gegevens" : "Technical Data"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isNL
                      ? "Consent timestamps en IP-adres bij toestemming, taalvoorkeur, nieuwsbrief opt-in status"
                      : "Consent timestamps and IP address at consent, language preference, newsletter opt-in status"}
                  </p>
                </div>
              </div>
            </section>

            {/* Purposes and Legal Bases */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <Scale className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Doeleinden en Rechtsgronden" : "Purposes and Legal Bases"}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isNL
                  ? "Wij verwerken uw persoonsgegevens voor de volgende doeleinden, op basis van de aangegeven rechtsgronden (Art. 6 AVG):"
                  : "We process your personal data for the following purposes, based on the indicated legal bases (Art. 6 GDPR):"}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-2 font-semibold">{isNL ? "Doeleinde" : "Purpose"}</th>
                      <th className="text-left p-2 font-semibold">{isNL ? "Rechtsgrond" : "Legal Basis"}</th>
                      <th className="text-left p-2 font-semibold">Artikel</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b">
                      <td className="p-2">{isNL ? "Verwerken bestellingen" : "Processing orders"}</td>
                      <td className="p-2">{isNL ? "Uitvoering overeenkomst" : "Contract performance"}</td>
                      <td className="p-2">Art. 6(1)(b)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{isNL ? "Loyaliteitsprogramma beheer" : "Loyalty program management"}</td>
                      <td className="p-2">{isNL ? "Uitvoering overeenkomst" : "Contract performance"}</td>
                      <td className="p-2">Art. 6(1)(b)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{isNL ? "Boekhoudkundige verplichtingen" : "Accounting obligations"}</td>
                      <td className="p-2">{isNL ? "Wettelijke verplichting" : "Legal obligation"}</td>
                      <td className="p-2">Art. 6(1)(c)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{isNL ? "Nieuwsbrief" : "Newsletter"}</td>
                      <td className="p-2">{isNL ? "Toestemming" : "Consent"}</td>
                      <td className="p-2">Art. 6(1)(a)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{isNL ? "Verbetering diensten" : "Service improvement"}</td>
                      <td className="p-2">{isNL ? "Gerechtvaardigd belang" : "Legitimate interest"}</td>
                      <td className="p-2">Art. 6(1)(f)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Processors and International Transfers */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <Globe className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Verwerkers en Internationale Transfers" : "Processors and International Transfers"}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isNL
                  ? "Wij maken gebruik van de volgende dienstverleners (verwerkers) om onze diensten te leveren. Sommige van deze partijen zijn gevestigd buiten de Europese Economische Ruimte (EER)."
                  : "We use the following service providers (processors) to deliver our services. Some of these parties are located outside the European Economic Area (EEA)."}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-2 font-semibold">{isNL ? "Verwerker" : "Processor"}</th>
                      <th className="text-left p-2 font-semibold">{isNL ? "Locatie" : "Location"}</th>
                      <th className="text-left p-2 font-semibold">{isNL ? "Doel" : "Purpose"}</th>
                      <th className="text-left p-2 font-semibold">{isNL ? "Waarborgen" : "Safeguards"}</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b">
                      <td className="p-2 font-medium">Mollie B.V.</td>
                      <td className="p-2">Nederland (EU)</td>
                      <td className="p-2">{isNL ? "Betalingsverwerking" : "Payment processing"}</td>
                      <td className="p-2"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">EU</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Supabase Inc.</td>
                      <td className="p-2">AWS Frankfurt (EU)</td>
                      <td className="p-2">Database hosting</td>
                      <td className="p-2"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">EU</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Brevo (Sendinblue)</td>
                      <td className="p-2">{isNL ? "Frankrijk (EU)" : "France (EU)"}</td>
                      <td className="p-2">{isNL ? "Email verzending" : "Email delivery"}</td>
                      <td className="p-2"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">EU</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Google LLC</td>
                      <td className="p-2">{isNL ? "Verenigde Staten" : "United States"}</td>
                      <td className="p-2">{isNL ? "Optionele login (OAuth)" : "Optional login (OAuth)"}</td>
                      <td className="p-2"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">SCCs</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Vercel Inc.</td>
                      <td className="p-2">{isNL ? "VS / EU edge" : "US / EU edge"}</td>
                      <td className="p-2">Website hosting</td>
                      <td className="p-2"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">SCCs</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {isNL
                  ? "Voor transfers naar de VS maken wij gebruik van Standard Contractual Clauses (SCCs) zoals goedgekeurd door de Europese Commissie, als rechtsgrond voor de doorgifte."
                  : "For transfers to the US, we rely on Standard Contractual Clauses (SCCs) as approved by the European Commission."}
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <UserCheck className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Uw Rechten (GDPR)" : "Your Rights (GDPR)"}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isNL
                  ? "Onder de AVG heeft u de volgende rechten met betrekking tot uw persoonsgegevens:"
                  : "Under the GDPR, you have the following rights regarding your personal data:"}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-2 font-semibold">{isNL ? "Recht" : "Right"}</th>
                      <th className="text-left p-2 font-semibold">Artikel</th>
                      <th className="text-left p-2 font-semibold">{isNL ? "Hoe uit te oefenen" : "How to exercise"}</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b">
                      <td className="p-2">{isNL ? "Recht op inzage" : "Right to access"}</td>
                      <td className="p-2">Art. 15</td>
                      <td className="p-2">{isNL ? "Accountinstellingen of privacy@yibeitea.be" : "Account settings or privacy@yibeitea.be"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{isNL ? "Recht op rectificatie" : "Right to rectification"}</td>
                      <td className="p-2">Art. 16</td>
                      <td className="p-2">{isNL ? "Accountinstellingen" : "Account settings"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{isNL ? "Recht op vergetelheid" : "Right to erasure"}</td>
                      <td className="p-2">Art. 17</td>
                      <td className="p-2">{isNL ? "Accountinstellingen (account verwijderen)" : "Account settings (delete account)"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{isNL ? "Recht op beperking" : "Right to restriction"}</td>
                      <td className="p-2">Art. 18</td>
                      <td className="p-2">privacy@yibeitea.be</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{isNL ? "Recht op dataportabiliteit" : "Right to data portability"}</td>
                      <td className="p-2">Art. 20</td>
                      <td className="p-2">{isNL ? "Accountinstellingen (JSON export)" : "Account settings (JSON export)"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{isNL ? "Recht van bezwaar" : "Right to object"}</td>
                      <td className="p-2">Art. 21</td>
                      <td className="p-2">privacy@yibeitea.be</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{isNL ? "Recht toestemming in te trekken" : "Right to withdraw consent"}</td>
                      <td className="p-2">Art. 7(3)</td>
                      <td className="p-2">{isNL ? "Accountinstellingen of uitschrijflink" : "Account settings or unsubscribe link"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <Clock className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Bewaartermijnen" : "Data Retention"}</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong>{isNL ? "Accountgegevens:" : "Account data:"}</strong>{" "}
                  {isNL ? "Bewaard tot u uw account verwijdert" : "Retained until you delete your account"}
                </li>
                <li>
                  <strong>{isNL ? "Bestelgegevens:" : "Order data:"}</strong>{" "}
                  {isNL ? "7 jaar (wettelijke verplichting voor boekhouding, Art. 60 BTW-Wetboek)" : "7 years (legal requirement for accounting)"}
                </li>
                <li>
                  <strong>{isNL ? "Gastbestellingen:" : "Guest orders:"}</strong>{" "}
                  {isNL ? "Geanonimiseerd na 2 jaar" : "Anonymized after 2 years"}
                </li>
                <li>
                  <strong>{isNL ? "Consent records:" : "Consent records:"}</strong>{" "}
                  {isNL ? "5 jaar na intrekking" : "5 years after withdrawal"}
                </li>
              </ul>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="heading-3">{isNL ? "Cookies" : "Cookies"}</h2>
              <p className="text-sm text-muted-foreground">
                {isNL
                  ? "Wij gebruiken uitsluitend strikt noodzakelijke cookies voor het functioneren van de website: sessiecookies, authenticatiecookies, en winkelwagencookies. Deze cookies zijn noodzakelijk voor de werking van de website en vereisen geen toestemming onder Art. 5(3) van de ePrivacy Richtlijn. Wij gebruiken geen tracking-, advertentie- of analytische cookies."
                  : "We only use strictly necessary cookies for website functionality: session cookies, authentication cookies, and shopping cart cookies. These cookies are necessary for the website to function and do not require consent under Art. 5(3) of the ePrivacy Directive. We do not use tracking, advertising, or analytics cookies."}
              </p>
            </section>

            {/* Newsletter */}
            <section className="mb-8">
              <h2 className="heading-3">{isNL ? "Nieuwsbrief" : "Newsletter"}</h2>
              <p className="text-sm text-muted-foreground">
                {isNL
                  ? "U ontvangt alleen marketingcommunicatie (nieuwsbrief) als u hiervoor expliciet toestemming heeft gegeven. U kunt zich te allen tijde uitschrijven via: de uitschrijflink onderaan elke nieuwsbrief, uw accountinstellingen op onze website, of door contact met ons op te nemen via privacy@yibeitea.be."
                  : "You will only receive marketing communications (newsletter) if you have given explicit consent. You can unsubscribe at any time via: the unsubscribe link at the bottom of each newsletter, your account settings on our website, or by contacting us at privacy@yibeitea.be."}
              </p>
            </section>

            {/* Contact & Complaints */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-tea-100 p-2">
                  <Mail className="h-5 w-5 text-tea-600" />
                </div>
                <h2 className="heading-3 !mt-0 !mb-0">{isNL ? "Contact & Klachten" : "Contact & Complaints"}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isNL
                  ? "Voor vragen over uw privacy of om uw rechten uit te oefenen, kunt u contact opnemen via:"
                  : "For questions about your privacy or to exercise your rights, you can contact us at:"}
              </p>
              <p className="mt-2">
                <a href="mailto:privacy@yibeitea.be" className="text-tea-600 hover:underline">
                  privacy@yibeitea.be
                </a>
              </p>

              <p className="text-sm text-muted-foreground mt-6">
                {isNL
                  ? "Indien u een klacht heeft over de verwerking van uw persoonsgegevens, kunt u contact opnemen met de Gegevensbeschermingsautoriteit:"
                  : "If you have a complaint about the processing of your personal data, you can contact the Data Protection Authority:"}
              </p>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm mt-3">
                <p className="font-semibold">Gegevensbeschermingsautoriteit (GBA)</p>
                <p>Drukpersstraat 35</p>
                <p>1000 Brussel</p>
                <p>Tel: +32 2 274 48 00</p>
                <p>
                  Website:{" "}
                  <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener noreferrer" className="text-tea-600 hover:underline">
                    www.gegevensbeschermingsautoriteit.be
                  </a>
                </p>
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
