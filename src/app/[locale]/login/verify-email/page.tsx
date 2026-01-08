"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

type VerificationStatus = "loading" | "success" | "already_verified" | "error";

export default function VerifyEmailPage() {
  const t = useTranslations("auth.verification");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(t("noToken"));
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
          setErrorMessage(data.error || t("failed"));
        }
      } catch {
        setStatus("error");
        setErrorMessage(t("failed"));
      }
    };

    verifyEmail();
  }, [token, t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-tea-50 to-cream-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tea-100">
                <Loader2 className="h-8 w-8 text-tea-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">{t("verifying")}</CardTitle>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">
                {t("success")}
              </CardTitle>
            </>
          )}

          {status === "already_verified" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tea-100">
                <Mail className="h-8 w-8 text-tea-600" />
              </div>
              <CardTitle className="text-2xl">
                {t("alreadyVerified")}
              </CardTitle>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-700">
                {t("failed")}
              </CardTitle>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "loading" && (
            <p className="text-center text-muted-foreground">
              {t("verifyingWait")}
            </p>
          )}

          {status === "success" && (
            <>
              <p className="text-center text-muted-foreground">
                {t("successMessage")}
              </p>
              <Link href="/login" className="block">
                <Button variant="tea" className="w-full">
                  {t("goToLogin")}
                </Button>
              </Link>
            </>
          )}

          {status === "already_verified" && (
            <>
              <p className="text-center text-muted-foreground">
                {t("alreadyVerifiedMessage")}
              </p>
              <Link href="/login" className="block">
                <Button variant="tea" className="w-full">
                  {t("goToLogin")}
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
                {t("failedMessage")}
              </p>
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full">
                  {t("backToLogin")}
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
