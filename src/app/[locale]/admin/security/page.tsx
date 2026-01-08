"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Key,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/trpc";

type SetupStep = "initial" | "qr-code" | "verify" | "success";

export default function AdminSecurityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [setupStep, setSetupStep] = useState<SetupStep>("initial");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // tRPC queries and mutations
  const { data: twoFactorStatus, isLoading: statusLoading, refetch: refetchStatus } =
    api.twoFactor.getStatus.useQuery(undefined, {
      enabled: status === "authenticated",
    });

  const initSetupMutation = api.twoFactor.initSetup.useMutation({
    onSuccess: (data) => {
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setSetupStep("qr-code");
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const enableMutation = api.twoFactor.enable.useMutation({
    onSuccess: () => {
      setSetupStep("success");
      setError("");
      refetchStatus();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const disableMutation = api.twoFactor.disable.useMutation({
    onSuccess: () => {
      setSetupStep("initial");
      setSecret("");
      setQrCode("");
      setVerificationCode("");
      setError("");
      refetchStatus();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  if (status === "loading" || statusLoading) {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        </div>
      </div>
    );
  }

  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isAdmin = userRole === "ADMIN" || isSuperAdmin;

  if (status === "unauthenticated" || !isAdmin) {
    router.push("/");
    return null;
  }

  const handleStartSetup = () => {
    initSetupMutation.mutate();
  };

  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      setError("Voer een 6-cijferige code in");
      return;
    }
    enableMutation.mutate({ token: verificationCode });
  };

  const handleDisable = () => {
    if (verificationCode.length !== 6) {
      setError("Voer een 6-cijferige code in om 2FA uit te schakelen");
      return;
    }
    disableMutation.mutate({ token: verificationCode });
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="section-padding bg-muted/30">
      <div className="container-custom max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="heading-2">Beveiliging</h1>
            <p className="text-muted-foreground">
              Beheer twee-factor authenticatie voor je account
            </p>
          </div>
        </div>

        {/* 2FA Required Warning for Admin users */}
        {isAdmin && !twoFactorStatus?.isEnabled && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="flex items-start gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">
                  Twee-factor authenticatie vereist
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Als beheerder moet je twee-factor authenticatie inschakelen voor extra beveiliging.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Status */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {twoFactorStatus?.isEnabled ? (
                  <div className="rounded-full bg-green-100 p-2">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  </div>
                ) : (
                  <div className="rounded-full bg-muted p-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">
                    Twee-Factor Authenticatie (2FA)
                  </CardTitle>
                  <CardDescription>
                    Voeg een extra beveiligingslaag toe aan je account
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant={twoFactorStatus?.isEnabled ? "default" : "secondary"}
                className={twoFactorStatus?.isEnabled ? "bg-green-100 text-green-800" : ""}
              >
                {twoFactorStatus?.isEnabled ? "Ingeschakeld" : "Uitgeschakeld"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Setup Flow */}
        {!twoFactorStatus?.isEnabled ? (
          <>
            {setupStep === "initial" && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-tea-100 p-3">
                        <Smartphone className="h-6 w-6 text-tea-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Hoe werkt het?</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Je gebruikt een authenticator app (zoals Google Authenticator, Authy of 1Password)
                          om eenmalige codes te genereren bij het inloggen.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Vereisten:</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          Installeer een authenticator app op je telefoon
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          Scan de QR-code met de app
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          Voer de gegenereerde code in ter verificatie
                        </li>
                      </ul>
                    </div>

                    {error && (
                      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    <Button
                      variant="tea"
                      className="w-full"
                      onClick={handleStartSetup}
                      disabled={initSetupMutation.isPending}
                    >
                      {initSetupMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Bezig...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          Start 2FA Setup
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {setupStep === "qr-code" && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg">Scan deze QR-code</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Open je authenticator app en scan onderstaande code
                      </p>
                    </div>

                    {/* QR Code - using img for data URL (Next/Image doesn't support data URLs) */}
                    <div className="flex justify-center">
                      <div className="rounded-2xl border-4 border-tea-100 bg-white p-4">
                        {qrCode && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={qrCode}
                            alt="2FA QR Code"
                            className="h-48 w-48"
                          />
                        )}
                      </div>
                    </div>

                    {/* Manual Entry */}
                    <div className="space-y-2">
                      <p className="text-center text-sm text-muted-foreground">
                        Of voer deze code handmatig in:
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          value={secret}
                          readOnly
                          className="font-mono text-center tracking-wider"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyToClipboard}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <Button
                        variant="tea"
                        className="w-full"
                        onClick={() => setSetupStep("verify")}
                      >
                        Volgende: Verificatie
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {setupStep === "verify" && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg">Verificatie</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Voer de 6-cijferige code in van je authenticator app
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code">Verificatiecode</Label>
                      <Input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setVerificationCode(value);
                          setError("");
                        }}
                        className="text-center text-2xl font-mono tracking-[0.5em]"
                      />
                    </div>

                    {error && (
                      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSetupStep("qr-code")}
                      >
                        Terug
                      </Button>
                      <Button
                        variant="tea"
                        className="flex-1"
                        onClick={handleVerify}
                        disabled={enableMutation.isPending || verificationCode.length !== 6}
                      >
                        {enableMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Activeer 2FA"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {setupStep === "success" && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="space-y-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <ShieldCheck className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-green-800">
                        2FA Succesvol Geactiveerd!
                      </h3>
                      <p className="mt-2 text-sm text-green-700">
                        Je account is nu extra beveiligd met twee-factor authenticatie.
                        Bij volgende logins moet je een code van je authenticator app invoeren.
                      </p>
                    </div>
                    <Link href="/admin">
                      <Button variant="outline" className="border-green-300">
                        Terug naar Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* 2FA is enabled - show disable option */
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">2FA is actief</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Je account is beveiligd met twee-factor authenticatie.
                    </p>
                  </div>
                </div>

                {/* All admin users cannot disable 2FA */}
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    <ShieldAlert className="mr-2 inline h-4 w-4" />
                    Als beheerder kun je twee-factor authenticatie niet uitschakelen.
                    Dit is verplicht voor alle admin accounts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/admin">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
