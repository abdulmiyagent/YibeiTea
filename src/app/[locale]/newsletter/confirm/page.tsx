"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { api } from "@/lib/trpc";

type ConfirmationStatus = "loading" | "success" | "already_confirmed" | "error";

export default function NewsletterConfirmPage() {
  const t = useTranslations("footer.newsletter");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<ConfirmationStatus>("loading");

  const confirmMutation = api.newsletter.confirmSubscription.useMutation({
    onSuccess: (data) => {
      if (data.message === "already_confirmed") {
        setStatus("already_confirmed");
      } else {
        setStatus("success");
      }
    },
    onError: () => {
      setStatus("error");
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    confirmMutation.mutate({ token });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-tea-50 to-cream-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tea-100">
                <Loader2 className="h-8 w-8 text-tea-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Bevestigen...</CardTitle>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">
                Inschrijving bevestigd!
              </CardTitle>
            </>
          )}

          {status === "already_confirmed" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tea-100">
                <Mail className="h-8 w-8 text-tea-600" />
              </div>
              <CardTitle className="text-2xl">
                Al bevestigd
              </CardTitle>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-700">
                Bevestiging mislukt
              </CardTitle>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "loading" && (
            <p className="text-center text-muted-foreground">
              Even geduld terwijl we je inschrijving bevestigen...
            </p>
          )}

          {status === "success" && (
            <>
              <p className="text-center text-muted-foreground">
                Je bent nu ingeschreven voor onze nieuwsbrief! Je ontvangt binnenkort exclusieve aanbiedingen en nieuws over seizoensspecials.
              </p>
              <Link href="/" className="block">
                <Button variant="tea" className="w-full">
                  Naar de website
                </Button>
              </Link>
            </>
          )}

          {status === "already_confirmed" && (
            <>
              <p className="text-center text-muted-foreground">
                Je inschrijving was al bevestigd. Je ontvangt onze nieuwsbrief.
              </p>
              <Link href="/" className="block">
                <Button variant="tea" className="w-full">
                  Naar de website
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-center text-sm text-muted-foreground">
                De bevestigingslink is ongeldig of verlopen. Probeer je opnieuw in te schrijven via de footer van onze website.
              </p>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  Naar de website
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
