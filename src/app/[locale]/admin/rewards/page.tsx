"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/trpc";
import { getDisplayName } from "@/lib/utils";
import {
  Gift,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Coins,
  Edit,
  X,
  Save,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { translate } from "@/lib/translate";

const REWARD_TYPES = [
  { value: "DISCOUNT", label: "Korting (€)" },
  { value: "FREE_DRINK", label: "Gratis drankje" },
  { value: "FREE_TOPPING", label: "Gratis topping" },
  { value: "SIZE_UPGRADE", label: "Size upgrade" },
];

type RewardTranslation = {
  locale: "nl" | "en";
  name: string;
  description: string;
};

export default function RewardsAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    pointsCost: "",
    rewardType: "DISCOUNT" as "DISCOUNT" | "FREE_DRINK" | "FREE_TOPPING" | "SIZE_UPGRADE",
    rewardValue: "",
    isAvailable: true,
    nameNl: "",
    nameEn: "",
    descriptionNl: "",
    descriptionEn: "",
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [manuallyEditedEn, setManuallyEditedEn] = useState({ name: false, description: false });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  // Auto-translate when NL fields change (with debounce)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const shouldTranslateName = formData.nameNl && !manuallyEditedEn.name;
    const shouldTranslateDesc = formData.descriptionNl && !manuallyEditedEn.description;

    if (!shouldTranslateName && !shouldTranslateDesc) return;

    debounceTimerRef.current = setTimeout(async () => {
      setIsTranslating(true);
      try {
        const [nameEn, descriptionEn] = await Promise.all([
          shouldTranslateName ? translate(formData.nameNl, "nl-en") : null,
          shouldTranslateDesc ? translate(formData.descriptionNl, "nl-en") : null,
        ]);
        setFormData((prev) => ({
          ...prev,
          ...(nameEn !== null && { nameEn }),
          ...(descriptionEn !== null && { descriptionEn }),
        }));
      } catch (error) {
        console.error("Translation failed:", error);
      } finally {
        setIsTranslating(false);
      }
    }, 800);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData.nameNl, formData.descriptionNl, manuallyEditedEn]);

  const utils = api.useUtils();

  const { data: rewards, isLoading } = api.rewards.getAllAdmin.useQuery(undefined, {
    enabled: status === "authenticated" && isAdmin,
  });

  const createMutation = api.rewards.create.useMutation({
    onSuccess: () => {
      utils.rewards.getAllAdmin.invalidate();
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = api.rewards.update.useMutation({
    onSuccess: () => {
      utils.rewards.getAllAdmin.invalidate();
      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = api.rewards.delete.useMutation({
    onSuccess: () => {
      utils.rewards.getAllAdmin.invalidate();
    },
  });

  const resetForm = () => {
    setFormData({
      slug: "",
      pointsCost: "",
      rewardType: "DISCOUNT",
      rewardValue: "",
      isAvailable: true,
      nameNl: "",
      nameEn: "",
      descriptionNl: "",
      descriptionEn: "",
    });
    setManuallyEditedEn({ name: false, description: false });
    setEditingId(null);
  };

  const handleEdit = (reward: NonNullable<typeof rewards>[0]) => {
    const nlTranslation = reward.translations.find((t) => t.locale === "nl");
    const enTranslation = reward.translations.find((t) => t.locale === "en");

    setEditingId(reward.id);
    setFormData({
      slug: reward.slug,
      pointsCost: reward.pointsCost.toString(),
      rewardType: reward.rewardType as "DISCOUNT" | "FREE_DRINK" | "FREE_TOPPING" | "SIZE_UPGRADE",
      rewardValue: reward.rewardValue.toString(),
      isAvailable: reward.isAvailable,
      nameNl: nlTranslation?.name || "",
      nameEn: enTranslation?.name || "",
      descriptionNl: nlTranslation?.description || "",
      descriptionEn: enTranslation?.description || "",
    });
    setManuallyEditedEn({
      name: !!enTranslation?.name,
      description: !!enTranslation?.description,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const translations: RewardTranslation[] = [
      { locale: "nl", name: formData.nameNl, description: formData.descriptionNl },
      { locale: "en", name: formData.nameEn, description: formData.descriptionEn },
    ];

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        slug: formData.slug,
        pointsCost: parseInt(formData.pointsCost),
        rewardType: formData.rewardType,
        rewardValue: parseFloat(formData.rewardValue),
        isAvailable: formData.isAvailable,
        translations,
      });
    } else {
      createMutation.mutate({
        slug: formData.slug,
        pointsCost: parseInt(formData.pointsCost),
        rewardType: formData.rewardType,
        rewardValue: parseFloat(formData.rewardValue),
        isAvailable: formData.isAvailable,
        translations,
      });
    }
  };

  const handleToggleAvailable = (id: string, currentStatus: boolean) => {
    updateMutation.mutate({ id, isAvailable: !currentStatus });
  };

  const handleDelete = (id: string) => {
    if (confirm("Weet je zeker dat je deze beloning wilt verwijderen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

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

  if (status === "unauthenticated" || !isAdmin) {
    router.push("/");
    return null;
  }

  const getRewardTypeLabel = (type: string) => {
    return REWARD_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="heading-2 flex items-center gap-3">
                <Gift className="h-7 w-7 text-tea-600" />
                Beloningen
              </h1>
              <p className="text-muted-foreground">
                Beheer loyalty beloningen die klanten kunnen inwisselen
              </p>
            </div>
          </div>
          <Button variant="tea" onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe beloning
          </Button>
        </div>

        {/* Rewards List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        ) : rewards && rewards.length > 0 ? (
          <div className="grid gap-4">
            {rewards.map((reward) => {
              const nlTranslation = reward.translations.find((t) => t.locale === "nl");
              return (
                <Card key={reward.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tea-100">
                        <Gift className="h-6 w-6 text-tea-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold">
                            {getDisplayName(nlTranslation?.name, reward.slug)}
                          </p>
                          <Badge className={reward.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {reward.isAvailable ? "Actief" : "Inactief"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {getRewardTypeLabel(reward.rewardType)} - €{reward.rewardValue.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-right">
                        <Coins className="h-5 w-5 text-amber-500" />
                        <span className="text-lg font-bold">{reward.pointsCost}</span>
                        <span className="text-muted-foreground">punten</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={reward.isAvailable}
                          onCheckedChange={() => handleToggleAvailable(reward.id, reward.isAvailable)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(reward)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(reward.id)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">Geen beloningen</p>
              <p className="text-muted-foreground">
                Maak je eerste beloning aan die klanten kunnen inwisselen.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {editingId ? "Beloning Bewerken" : "Nieuwe Beloning"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (ID)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    placeholder="free-drink-small"
                    disabled={!!editingId}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unieke identifier voor deze beloning
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsCost">Punten kosten</Label>
                  <Input
                    id="pointsCost"
                    type="number"
                    min="1"
                    value={formData.pointsCost}
                    onChange={(e) => setFormData({ ...formData, pointsCost: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rewardType">Type beloning</Label>
                  <select
                    id="rewardType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.rewardType}
                    onChange={(e) => setFormData({ ...formData, rewardType: e.target.value as typeof formData.rewardType })}
                  >
                    {REWARD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rewardValue">Waarde (EUR)</Label>
                  <Input
                    id="rewardValue"
                    type="number"
                    step="0.50"
                    min="0"
                    value={formData.rewardValue}
                    onChange={(e) => setFormData({ ...formData, rewardValue: e.target.value })}
                    placeholder="5.00"
                  />
                </div>
              </div>

              {/* Dutch translations */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-medium">Nederlands</h4>
                <p className="text-xs text-muted-foreground">
                  Vul de Nederlandse tekst in - Engels wordt automatisch vertaald
                </p>
                <div className="space-y-2">
                  <Label htmlFor="nameNl">Naam</Label>
                  <Input
                    id="nameNl"
                    value={formData.nameNl}
                    onChange={(e) => setFormData({ ...formData, nameNl: e.target.value })}
                    placeholder="Gratis kleine bubble tea"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionNl">Beschrijving</Label>
                  <Input
                    id="descriptionNl"
                    value={formData.descriptionNl}
                    onChange={(e) => setFormData({ ...formData, descriptionNl: e.target.value })}
                    placeholder="Wissel in voor een gratis drankje naar keuze"
                  />
                </div>
              </div>

              {/* English translations */}
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">English</h4>
                  <div className="flex items-center gap-2">
                    {isTranslating && (
                      <span className="flex items-center text-xs text-muted-foreground">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Vertalen...
                      </span>
                    )}
                    {(manuallyEditedEn.name || manuallyEditedEn.description) && !isTranslating && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setManuallyEditedEn({ name: false, description: false })}
                        className="h-7 px-2 text-xs"
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Opnieuw vertalen
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {manuallyEditedEn.name || manuallyEditedEn.description
                    ? "Handmatig aangepast - klik 'Opnieuw vertalen' om te resetten"
                    : "Wordt automatisch vertaald vanuit Nederlands"}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">Name</Label>
                  <Input
                    id="nameEn"
                    value={formData.nameEn}
                    onChange={(e) => {
                      setFormData({ ...formData, nameEn: e.target.value });
                      setManuallyEditedEn((prev) => ({ ...prev, name: true }));
                    }}
                    placeholder="Free small bubble tea"
                    className={isTranslating ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">Description</Label>
                  <Input
                    id="descriptionEn"
                    value={formData.descriptionEn}
                    onChange={(e) => {
                      setFormData({ ...formData, descriptionEn: e.target.value });
                      setManuallyEditedEn((prev) => ({ ...prev, description: true }));
                    }}
                    placeholder="Redeem for a free drink of your choice"
                    className={isTranslating ? "bg-muted" : ""}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="rounded-lg border border-tea-200 bg-tea-50 p-4">
                <h4 className="mb-3 font-medium text-tea-800">Status</h4>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>Beschikbaar voor klanten om in te wisselen</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Annuleren
                </Button>
                <Button
                  variant="tea"
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending || !formData.slug || !formData.pointsCost || !formData.nameNl || !formData.nameEn}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
