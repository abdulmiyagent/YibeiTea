"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, MapPin, ArrowRight } from "lucide-react";

export default function OrderConfirmationPage() {
  const t = useTranslations("order.confirmation");
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "YBT-XXXXX";

  return (
    <div className="section-padding">
      <div className="container-custom">
        <div className="mx-auto max-w-lg text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-matcha-100">
            <CheckCircle className="h-10 w-10 text-matcha-600" />
          </div>

          <h1 className="heading-1 text-matcha-700">{t("title")}</h1>

          <Card className="mt-8">
            <CardContent className="space-y-6 pt-6">
              {/* Order Number */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">{t("orderNumber")}</p>
                <p className="text-2xl font-bold text-tea-600">{orderNumber}</p>
              </div>

              {/* Pickup Info */}
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-tea-600" />
                  <div>
                    <p className="font-medium">{t("pickupTime")}</p>
                    <p className="text-muted-foreground">Vandaag om 14:30</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-tea-600" />
                  <div>
                    <p className="font-medium">Yibei Tea</p>
                    <p className="text-muted-foreground">
                      Veldstraat 123<br />
                      9000 Gent
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Confirmation */}
              <p className="text-sm text-muted-foreground">
                {t("emailSent", { email: "jan@email.be" })}
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/menu">
              <Button variant="tea" size="lg">
                Nog een bestelling plaatsen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/account/orders">
              <Button variant="outline" size="lg">
                Bekijk mijn bestellingen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
