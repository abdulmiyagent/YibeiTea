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
  Share2,
  Instagram,
  Mail,
  Trash2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";

// Platform icons
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "instagram":
      return <Instagram className="h-4 w-4" />;
    case "tiktok":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "x":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case "snapchat":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
        </svg>
      );
    case "pinterest":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
        </svg>
      );
    case "email":
      return <Mail className="h-4 w-4" />;
    default:
      return <Share2 className="h-4 w-4" />;
  }
};

type SocialLink = { platform: string; href: string; isActive: boolean };

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
  const [slotsPerTimeWindow, setSlotsPerTimeWindow] = useState(10);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

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
      setSlotsPerTimeWindow(settings.slotsPerTimeWindow);
      setSocialLinks((settings.socialLinks as SocialLink[]) || []);
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
      slotsPerTimeWindow,
      socialLinks,
    });
  };

  const updateDayHours = (day: string, field: "open" | "close", value: string) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string | boolean) => {
    setSocialLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  };

  const addSocialLink = () => {
    setSocialLinks((prev) => [...prev, { platform: "other", href: "", isActive: true }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
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
              <div className="space-y-2">
                <Label>Bestellingen per 30 min tijdslot</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={slotsPerTimeWindow}
                  onChange={(e) => setSlotsPerTimeWindow(parseInt(e.target.value) || 10)}
                />
                <p className="text-xs text-muted-foreground">
                  Hoeveel bestellingen per 30 minuten toegestaan
                </p>
              </div>
              <div className="rounded-lg border border-tea-200 bg-tea-50/50 p-3">
                <p className="text-sm text-tea-700">
                  💡 Beheer specifieke tijdsloten via{" "}
                  <Link href="/admin/time-slots" className="font-medium underline">
                    Tijdsloten Beheer
                  </Link>
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

          {/* Social Media Links */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-tea-600" />
                Social Media Links
              </CardTitle>
              <CardDescription>
                Beheer de social media links die op de website worden getoond
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <PlatformIcon platform={link.platform} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={link.platform}
                        onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="facebook">Facebook</option>
                        <option value="x">X (Twitter)</option>
                        <option value="youtube">YouTube</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="snapchat">Snapchat</option>
                        <option value="pinterest">Pinterest</option>
                        <option value="email">Email</option>
                        <option value="other">Anders</option>
                      </select>
                      <Input
                        placeholder="URL (bv. https://instagram.com/...)"
                        value={link.href}
                        onChange={(e) => updateSocialLink(index, "href", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={link.isActive}
                        onCheckedChange={(checked) => updateSocialLink(index, "isActive", checked)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {link.isActive ? "Actief" : "Inactief"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSocialLink(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addSocialLink} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Link toevoegen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
