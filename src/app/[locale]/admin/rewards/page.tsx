"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/trpc";
import {
  Gift,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Coins,
  Edit,
} from "lucide-react";
import Link from "next/link";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const utils = api.useUtils();

  const { data: rewards, isLoading } = api.rewards.getAllAdmin.useQuery(undefined, {
    enabled: status === "authenticated" && isAdmin,
  });

  const createMutation = api.rewards.create.useMutation({
    onSuccess: () => {
      utils.rewards.getAllAdmin.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = api.rewards.update.useMutation({
    onSuccess: () => {
      utils.rewards.getAllAdmin.invalidate();
      setIsDialogOpen(false);
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
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
                <Gift className="h-8 w-8 text-tea-600" />
                Beloningen
              </h1>
              <p className="mt-2 text-muted-foreground">
                Beheer loyalty beloningen die klanten kunnen inwisselen
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingId(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="tea">
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe beloning
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Beloning bewerken" : "Nieuwe beloning"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Slug (ID)</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                        placeholder="free-drink-small"
                        required
                        disabled={!!editingId}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Punten kosten</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.pointsCost}
                        onChange={(e) => setFormData({ ...formData, pointsCost: e.target.value })}
                        placeholder="100"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={formData.rewardType}
                        onValueChange={(v: string) => setFormData({ ...formData, rewardType: v as typeof formData.rewardType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REWARD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Waarde (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.rewardValue}
                        onChange={(e) => setFormData({ ...formData, rewardValue: e.target.value })}
                        placeholder="5.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <h4 className="font-medium">Nederlands</h4>
                    <div className="space-y-2">
                      <Label>Naam (NL)</Label>
                      <Input
                        value={formData.nameNl}
                        onChange={(e) => setFormData({ ...formData, nameNl: e.target.value })}
                        placeholder="Gratis kleine bubble tea"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Beschrijving (NL)</Label>
                      <Input
                        value={formData.descriptionNl}
                        onChange={(e) => setFormData({ ...formData, descriptionNl: e.target.value })}
                        placeholder="Wissel in voor een gratis drankje"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <h4 className="font-medium">English</h4>
                    <div className="space-y-2">
                      <Label>Name (EN)</Label>
                      <Input
                        value={formData.nameEn}
                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                        placeholder="Free small bubble tea"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (EN)</Label>
                      <Input
                        value={formData.descriptionEn}
                        onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                        placeholder="Redeem for a free drink"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.isAvailable}
                      onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                    />
                    <Label>Beschikbaar</Label>
                  </div>

                  <Button
                    type="submit"
                    variant="tea"
                    className="w-full"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingId ? "Bijwerken..." : "Aanmaken..."}
                      </>
                    ) : (
                      editingId ? "Bijwerken" : "Aanmaken"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
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
                            {nlTranslation?.name || reward.slug}
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
    </div>
  );
}
