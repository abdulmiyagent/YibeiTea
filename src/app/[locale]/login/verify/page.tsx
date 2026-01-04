"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasSubmitted = useRef(false);

  // Get params from URL - password is stored in sessionStorage for security
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const email = searchParams.get("email");

  useEffect(() => {
    // Redirect if no email or no stored password
    if (!email) {
      router.push("/login");
      return;
    }

    const storedPassword = sessionStorage.getItem("2fa_pending_password");
    if (!storedPassword) {
      router.push("/login");
    }
  }, [email, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (hasSubmitted.current || isLoading) return;

    setError("");

    if (code.length !== 6) {
      setError("Voer een 6-cijferige code in");
      return;
    }

    if (!email) {
      setError("Sessie verlopen. Log opnieuw in.");
      return;
    }

    // Get password from sessionStorage (stored by login page)
    const storedPassword = sessionStorage.getItem("2fa_pending_password");
    if (!storedPassword) {
      setError("Sessie verlopen. Log opnieuw in.");
      router.push("/login");
      return;
    }

    hasSubmitted.current = true;
    setIsLoading(true);

    // Complete sign in with 2FA code
    const result = await signIn("credentials", {
      email: email,
      password: storedPassword,
      twoFactorCode: code,
      redirect: false,
    });

    if (result?.error) {
      hasSubmitted.current = false;
      if (result.error.includes("INVALID_2FA_CODE")) {
        setError("Ongeldige verificatiecode. Probeer opnieuw.");
      } else {
        setError("Er is een fout opgetreden. Probeer opnieuw in te loggen.");
      }
      setIsLoading(false);
      setCode("");
    } else {
      // Clear stored password and redirect
      sessionStorage.removeItem("2fa_pending_password");
      router.push(callbackUrl);
    }
  };

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && email && !isLoading && !hasSubmitted.current) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-tea-50 to-cream-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tea-100">
            <Shield className="h-8 w-8 text-tea-600" />
          </div>
          <CardTitle className="text-2xl">Twee-Factor Verificatie</CardTitle>
          <CardDescription>
            Voer de 6-cijferige code in van je authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="sr-only">
                Verificatiecode
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setCode(value);
                  setError("");
                }}
                className="text-center text-3xl font-mono tracking-[0.5em] py-6"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="tea"
              className="w-full"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifiëren...
                </>
              ) : (
                "Verifieer"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sessionStorage.removeItem("2fa_pending_password")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug naar login
              </Button>
            </Link>
          </div>

          <div className="mt-4 rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
            <p>
              Open je authenticator app (Google Authenticator, Authy, etc.)
              en voer de code in die wordt weergegeven voor Yibei Tea.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
