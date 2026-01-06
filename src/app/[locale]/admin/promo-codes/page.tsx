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
  Tag,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Percent,
  Euro,
  Calendar,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function PromoCodesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    discountValue: "",
    minOrderAmount: "",
    maxUses: "",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const utils = api.useUtils();

  const { data: promoCodes, isLoading } = api.promoCodes.getAll.useQuery(
    undefined,
    { enabled: status === "authenticated" && isAdmin }
  );

  const createMutation = api.promoCodes.create.useMutation({
    onSuccess: () => {
      utils.promoCodes.getAll.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = api.promoCodes.update.useMutation({
    onSuccess: () => {
      utils.promoCodes.getAll.invalidate();
    },
  });

  const deleteMutation = api.promoCodes.delete.useMutation({
    onSuccess: () => {
      utils.promoCodes.getAll.invalidate();
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      minOrderAmount: "",
      maxUses: "",
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      code: formData.code,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
    });
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    updateMutation.mutate({ id, isActive: !currentStatus });
  };

  const handleDelete = (id: string) => {
    if (confirm("Weet je zeker dat je deze promotiecode wilt verwijderen?")) {
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

  const now = new Date();

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
                <Tag className="h-8 w-8 text-tea-600" />
                Promotiecodes
              </h1>
              <p className="mt-2 text-muted-foreground">
                Beheer kortingscodes voor klanten
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="tea">
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe promotiecode</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="KORTING10"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={formData.discountType}
                        onValueChange={(v: string) => setFormData({ ...formData, discountType: v as "PERCENTAGE" | "FIXED_AMOUNT" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                          <SelectItem value="FIXED_AMOUNT">Vast bedrag (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Waarde</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        placeholder={formData.discountType === "PERCENTAGE" ? "10" : "5.00"}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Min. bestelbedrag (optioneel)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.minOrderAmount}
                        onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                        placeholder="15.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max. gebruik (optioneel)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.maxUses}
                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Geldig vanaf</Label>
                      <Input
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Geldig tot</Label>
                      <Input
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" variant="tea" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Aanmaken...
                      </>
                    ) : (
                      "Code aanmaken"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Promo Codes List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        ) : promoCodes && promoCodes.length > 0 ? (
          <div className="grid gap-4">
            {promoCodes.map((code) => {
              const isExpired = new Date(code.validUntil) < now;
              const isNotStarted = new Date(code.validFrom) > now;
              const isMaxed = code.maxUses && code.usedCount >= code.maxUses;
              const statusLabel = !code.isActive
                ? "Inactief"
                : isExpired
                ? "Verlopen"
                : isNotStarted
                ? "Nog niet actief"
                : isMaxed
                ? "Volledig gebruikt"
                : "Actief";
              const statusColor = !code.isActive || isExpired || isMaxed
                ? "bg-red-100 text-red-800"
                : isNotStarted
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800";

              return (
                <Card key={code.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tea-100">
                        {code.discountType === "PERCENTAGE" ? (
                          <Percent className="h-6 w-6 text-tea-600" />
                        ) : (
                          <Euro className="h-6 w-6 text-tea-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-mono text-lg font-bold">{code.code}</p>
                          <Badge className={statusColor}>{statusLabel}</Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {code.discountType === "PERCENTAGE"
                            ? `${code.discountValue}% korting`
                            : `€${code.discountValue.toFixed(2)} korting`}
                          {code.minOrderAmount && ` (min. €${code.minOrderAmount.toFixed(2)})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {code.usedCount}
                          {code.maxUses && `/${code.maxUses}`} gebruikt
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(code.validFrom).toLocaleDateString("nl-BE")} -{" "}
                          {new Date(code.validUntil).toLocaleDateString("nl-BE")}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={code.isActive}
                          onCheckedChange={() => handleToggleActive(code.id, code.isActive)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(code.id)}
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
              <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">Geen promotiecodes</p>
              <p className="text-muted-foreground">
                Maak je eerste promotiecode aan om klanten korting te geven.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
