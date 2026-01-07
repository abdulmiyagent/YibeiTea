"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, Eye, EyeOff, Newspaper } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    newsletterOptIn: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (isRegister) {
      if (formData.password !== formData.confirmPassword) {
        setError("Wachtwoorden komen niet overeen");
        setIsLoading(false);
        return;
      }

      // Register the user first
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          newsletterOptIn: formData.newsletterOptIn,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Er is een fout opgetreden");
        setIsLoading(false);
        return;
      }
    }

    // First, try to sign in to verify credentials
    const result = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      // Handle different error types
      if (result.error === "2FA_REQUIRED" || result.error === "Error: 2FA_REQUIRED") {
        // Store password temporarily in sessionStorage for 2FA verification
        sessionStorage.setItem("2fa_pending_password", formData.password);
        // Redirect to 2FA verification page
        router.push(`/login/verify?email=${encodeURIComponent(formData.email)}&callbackUrl=/account`);
        return;
      }

      if (result.error === "2FA_SETUP_REQUIRED" || result.error === "Error: 2FA_SETUP_REQUIRED") {
        // SUPER_ADMIN needs to set up 2FA first
        setError("Je moet eerst twee-factor authenticatie instellen voordat je kunt inloggen.");
        setIsLoading(false);
        return;
      }

      if (result.error === "INVALID_2FA_CODE" || result.error === "Error: INVALID_2FA_CODE") {
        setError("Ongeldige verificatiecode. Probeer opnieuw.");
        setIsLoading(false);
        return;
      }

      setError("Ongeldige inloggegevens");
      setIsLoading(false);
      return;
    }

    // Fetch the session to check user role
    const session = await getSession();
    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

    // Redirect based on role
    router.push(isAdmin ? "/admin" : "/account");
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/account" });
  };

  return (
    <div className="section-padding">
      <div className="container-custom">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-tea-100">
                <span className="text-2xl">🧋</span>
              </div>
              <CardTitle className="text-2xl">
                {isRegister ? "Account Aanmaken" : t("title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Naam</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Jan Janssen"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="jan@email.be"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isRegister && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {isRegister && (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Newspaper className="h-4 w-4 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <Label htmlFor="newsletter" className="cursor-pointer text-sm font-medium">
                          Nieuwsbrief
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Ontvang aanbiedingen en nieuws
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="newsletter"
                      checked={formData.newsletterOptIn}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, newsletterOptIn: checked })
                      }
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  type="submit"
                  variant="tea"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Even geduld..."
                    : isRegister
                    ? "Registreren"
                    : t("submit")}
                </Button>
              </form>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  {t("orContinueWith")}
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
            </CardContent>
            <CardFooter className="flex-col space-y-2 text-center text-sm">
              {isRegister ? (
                <p>
                  Al een account?{" "}
                  <button
                    className="text-tea-600 hover:underline"
                    onClick={() => setIsRegister(false)}
                  >
                    Log hier in
                  </button>
                </p>
              ) : (
                <p>
                  {t("noAccount")}{" "}
                  <button
                    className="text-tea-600 hover:underline"
                    onClick={() => setIsRegister(true)}
                  >
                    {t("register")}
                  </button>
                </p>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
