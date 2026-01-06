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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc";
import {
  Users,
  ArrowLeft,
  Loader2,
  Coins,
  Plus,
  Minus,
  Search,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

const TIER_COLORS = {
  BRONZE: "bg-amber-100 text-amber-800",
  SILVER: "bg-gray-200 text-gray-800",
  GOLD: "bg-yellow-100 text-yellow-800",
};

export default function UsersAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string | null;
    email: string;
    loyaltyPoints: number;
  } | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState("");
  const [pointsDescription, setPointsDescription] = useState("");

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const utils = api.useUtils();

  const { data: users, isLoading } = api.users.getAll.useQuery(
    { limit: 100 },
    { enabled: status === "authenticated" && isAdmin }
  );

  const addPointsMutation = api.users.addLoyaltyPoints.useMutation({
    onSuccess: () => {
      utils.users.getAll.invalidate();
      setSelectedUser(null);
      setPointsToAdd("");
      setPointsDescription("");
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

  if (status === "unauthenticated" || !isAdmin) {
    router.push("/");
    return null;
  }

  const filteredUsers = users?.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPoints = () => {
    if (!selectedUser || !pointsToAdd) return;
    addPointsMutation.mutate({
      userId: selectedUser.id,
      points: parseInt(pointsToAdd),
      description: pointsDescription || undefined,
    });
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
          <div>
            <h1 className="heading-1 flex items-center gap-3">
              <Users className="h-8 w-8 text-tea-600" />
              Klanten
            </h1>
            <p className="mt-2 text-muted-foreground">
              Beheer klantaccounts en loyaliteitspunten
            </p>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Zoek op naam of email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tea-100 text-lg font-bold text-tea-600">
                      {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold">{user.name || "Geen naam"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge className={TIER_COLORS[user.loyaltyTier as keyof typeof TIER_COLORS]}>
                          {user.loyaltyTier}
                        </Badge>
                        {user.role !== "USER" && (
                          <Badge variant="outline">{user.role}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-amber-500" />
                        <span className="text-xl font-bold">{user.loyaltyPoints}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">punten</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-tea-600" />
                        <span className="text-xl font-bold">{user._count.orders}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">bestellingen</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedUser({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        loyaltyPoints: user.loyaltyPoints,
                      })}
                    >
                      <Coins className="mr-2 h-4 w-4" />
                      Punten aanpassen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">Geen klanten gevonden</p>
              <p className="text-muted-foreground">
                {searchTerm ? "Probeer een andere zoekopdracht" : "Er zijn nog geen geregistreerde klanten"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Points Adjustment Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Punten aanpassen</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="font-medium">{selectedUser.name || selectedUser.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Huidige punten: <span className="font-bold">{selectedUser.loyaltyPoints}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Punten toevoegen/aftrekken</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPointsToAdd((prev) => {
                        const num = parseInt(prev) || 0;
                        return (num - 10).toString();
                      })}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={pointsToAdd}
                      onChange={(e) => setPointsToAdd(e.target.value)}
                      placeholder="0"
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPointsToAdd((prev) => {
                        const num = parseInt(prev) || 0;
                        return (num + 10).toString();
                      })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gebruik negatieve waarden om punten af te trekken
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Reden (optioneel)</Label>
                  <Input
                    value={pointsDescription}
                    onChange={(e) => setPointsDescription(e.target.value)}
                    placeholder="Bijv. Compensatie, Bonus, Correctie..."
                  />
                </div>

                {pointsToAdd && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm">
                      Nieuwe balans:{" "}
                      <span className="font-bold">
                        {selectedUser.loyaltyPoints + (parseInt(pointsToAdd) || 0)} punten
                      </span>
                    </p>
                  </div>
                )}

                <Button
                  variant="tea"
                  className="w-full"
                  onClick={handleAddPoints}
                  disabled={!pointsToAdd || addPointsMutation.isPending}
                >
                  {addPointsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    "Punten aanpassen"
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
