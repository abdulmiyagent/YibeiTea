"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc";
import {
  Settings,
  ArrowLeft,
  Loader2,
  Clock,
  Calendar,
  Coins,
  Save,
} from "lucide-react";
import Link from "next/link";

const DAYS = [
  { key: "monday", label: "Maandag" },
  { key: "tuesday", label: "Dinsdag" },
  { key: "wednesday", label: "Woensdag" },
  { key: "thursday", label: "Donderdag" },
  { key: "friday", label: "Vrijdag" },
  { key: "saturday", label: "Zaterdag" },
  { key: "sunday", label: "Zondag" },
];

type OpeningHours = Record<string, { open: string; close: string }>;

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [openingHours, setOpeningHours] = useState<OpeningHours>({});
  const [minPickupMinutes, setMinPickupMinutes] = useState(15);
  const [maxAdvanceOrderDays, setMaxAdvanceOrderDays] = useState(7);
  const [pointsPerEuro, setPointsPerEuro] = useState(10);

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const { data: settings, isLoading } = api.storeSettings.get.useQuery(undefined, {
    enabled: status === "authenticated" && isSuperAdmin,
  });

  const updateMutation = api.storeSettings.update.useMutation({
    onSuccess: () => {
      setIsSaving(false);
      alert("Instellingen opgeslagen!");
    },
    onError: (error) => {
      setIsSaving(false);
      alert("Fout bij opslaan: " + error.message);
    },
  });

  useEffect(() => {
    if (settings) {
      setOpeningHours(settings.openingHours as OpeningHours);
      setMinPickupMinutes(settings.minPickupMinutes);
      setMaxAdvanceOrderDays(settings.maxAdvanceOrderDays);
      setPointsPerEuro(settings.pointsPerEuro);
    }
  }, [settings]);

  if (status === "loading" || isLoading) {
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

  if (status === "unauthenticated" || !isSuperAdmin) {
    router.push("/admin");
    return null;
  }

  const handleSave = () => {
    setIsSaving(true);
    updateMutation.mutate({
      openingHours,
      minPickupMinutes,
      maxAdvanceOrderDays,
      pointsPerEuro,
    });
  };

  const updateDayHours = (day: string, field: "open" | "close", value: string) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  return (
    <div className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-1 flex items-center gap-3">
                <Settings className="h-8 w-8 text-tea-600" />
                Instellingen
              </h1>
              <p className="mt-2 text-muted-foreground">
                Beheer winkel- en loyaliteitsinstellingen
              </p>
            </div>
            <Button variant="tea" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Opslaan
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Opening Hours */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-tea-600" />
                Openingstijden
              </CardTitle>
              <CardDescription>
                Stel de openingstijden van de winkel in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {DAYS.map((day) => (
                  <div key={day.key} className="space-y-2 rounded-lg border p-3">
                    <Label className="font-medium">{day.label}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={openingHours[day.key]?.open || "11:00"}
                        onChange={(e) => updateDayHours(day.key, "open", e.target.value)}
                        className="w-full"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={openingHours[day.key]?.close || "20:00"}
                        onChange={(e) => updateDayHours(day.key, "close", e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-tea-600" />
                Bestelling Instellingen
              </CardTitle>
              <CardDescription>
                Instellingen voor ophalen en vooruit bestellen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Minimale voorbereidingstijd (minuten)</Label>
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={minPickupMinutes}
                  onChange={(e) => setMinPickupMinutes(parseInt(e.target.value) || 15)}
                />
                <p className="text-xs text-muted-foreground">
                  Hoeveel minuten vooruit moet een klant minimaal bestellen
                </p>
              </div>
              <div className="space-y-2">
                <Label>Maximaal dagen vooruit bestellen</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={maxAdvanceOrderDays}
                  onChange={(e) => setMaxAdvanceOrderDays(parseInt(e.target.value) || 7)}
                />
                <p className="text-xs text-muted-foreground">
                  Hoeveel dagen vooruit kan een klant bestellen
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Loyalty Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-tea-600" />
                Loyaliteitspunten
              </CardTitle>
              <CardDescription>
                Instellingen voor het puntensysteem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Punten per euro</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={pointsPerEuro}
                  onChange={(e) => setPointsPerEuro(parseInt(e.target.value) || 10)}
                />
                <p className="text-xs text-muted-foreground">
                  Hoeveel punten verdient een klant per euro besteding
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium">Tier Drempels</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Bronze: 0 - 499 punten</li>
                  <li>Silver: 500 - 999 punten</li>
                  <li>Gold: 1000+ punten</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
