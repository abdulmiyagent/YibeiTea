"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

type VerificationStatus = "loading" | "success" | "already_verified" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Geen verificatietoken gevonden in de URL.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          if (data.alreadyVerified) {
            setStatus("already_verified");
          } else {
            setStatus("success");
          }
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Verificatie mislukt");
        }
      } catch {
        setStatus("error");
        setErrorMessage("Er is een fout opgetreden bij het verifiëren");
      }
    };

    verifyEmail();
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
              <CardTitle className="text-2xl">E-mail verifiëren...</CardTitle>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">
                E-mail bevestigd!
              </CardTitle>
            </>
          )}

          {status === "already_verified" && (
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
                Verificatie mislukt
              </CardTitle>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "loading" && (
            <p className="text-center text-muted-foreground">
              Even geduld terwijl we je e-mailadres verifiëren...
            </p>
          )}

          {status === "success" && (
            <>
              <p className="text-center text-muted-foreground">
                Je e-mailadres is succesvol bevestigd. Je kunt nu inloggen en
                genieten van alle voordelen van je Yibei Tea account.
              </p>
              <Link href="/login" className="block">
                <Button variant="tea" className="w-full">
                  Naar inloggen
                </Button>
              </Link>
            </>
          )}

          {status === "already_verified" && (
            <>
              <p className="text-center text-muted-foreground">
                Je e-mailadres was al bevestigd. Je kunt direct inloggen.
              </p>
              <Link href="/login" className="block">
                <Button variant="tea" className="w-full">
                  Naar inloggen
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                De verificatielink kan verlopen zijn of is al gebruikt.
                Probeer opnieuw in te loggen om een nieuwe verificatie-email aan te vragen.
              </p>
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full">
                  Terug naar inloggen
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
