"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc";
import {
  Settings,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  Shield,
  ChevronLeft,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function AccountSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const exportDataMutation = api.users.exportData.useQuery(undefined, {
    enabled: false,
  });

  const deleteAccountMutation = api.users.deleteAccount.useMutation({
    onSuccess: async () => {
      await signOut({ callbackUrl: "/" });
    },
    onError: (error) => {
      setDeleteError(error.message);
      setIsDeleting(false);
    },
  });

  if (status === "loading") {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const result = await exportDataMutation.refetch();
      if (result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `yibei-tea-data-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmEmail.toLowerCase() !== session?.user?.email?.toLowerCase()) {
      setDeleteError("E-mailadres komt niet overeen");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");
    deleteAccountMutation.mutate({ confirmEmail });
  };

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Back link */}
        <Link
          href="/account"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Terug naar account
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-1 flex items-center gap-3">
            <Settings className="h-8 w-8 text-tea-600" />
            Accountinstellingen
          </h1>
          <p className="mt-2 text-muted-foreground">
            Beheer je privacy en accountgegevens
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Data Export Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-tea-600" />
                Gegevens Exporteren
              </CardTitle>
              <CardDescription>
                Download al je persoonlijke gegevens in JSON-formaat (GDPR Art. 20)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Je export bevat: profielgegevens, bestellingen, favorieten, loyaliteitspunten en beoordelingen.
              </p>
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporteren...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Mijn Gegevens
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Privacy Links Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-tea-600" />
                Privacy & Voorwaarden
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/privacy"
                className="block text-tea-600 hover:underline"
              >
                Privacybeleid bekijken
              </Link>
              <Link
                href="/terms"
                className="block text-tea-600 hover:underline"
              >
                Algemene voorwaarden bekijken
              </Link>
            </CardContent>
          </Card>

          {/* Delete Account Card */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Trash2 className="h-5 w-5" />
                Account Verwijderen
              </CardTitle>
              <CardDescription>
                Permanent je account en alle bijbehorende gegevens verwijderen (GDPR Art. 17)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Let op: Deze actie kan niet ongedaan worden gemaakt. Je verliest toegang tot je
                    loyaliteitspunten, bestelgeschiedenis en favorieten.
                  </p>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Account Verwijderen
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-800">
                          Weet je zeker dat je je account wilt verwijderen?
                        </p>
                        <p className="mt-1 text-sm text-red-700">
                          Al je persoonlijke gegevens worden permanent verwijderd. Bestellingen
                          worden geanonimiseerd voor onze administratie.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">
                      Typ je e-mailadres ter bevestiging
                    </Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      placeholder={session?.user?.email || ""}
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                    />
                  </div>

                  {deleteError && (
                    <p className="text-sm text-red-600">{deleteError}</p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setConfirmEmail("");
                        setDeleteError("");
                      }}
                    >
                      Annuleren
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !confirmEmail}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verwijderen...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Definitief Verwijderen
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
