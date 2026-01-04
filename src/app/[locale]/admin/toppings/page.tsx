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
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowLeft,
  X,
  Save,
  Eye,
  EyeOff,
  GripVertical,
  Cherry,
} from "lucide-react";
import Link from "next/link";

// Sample toppings data - would come from database via tRPC
const sampleToppings = [
  {
    id: "1",
    slug: "tapioca",
    price: 0.5,
    isAvailable: true,
    sortOrder: 1,
    name: "Tapioca",
    nameEn: "Tapioca",
  },
  {
    id: "2",
    slug: "popping-boba",
    price: 0.5,
    isAvailable: true,
    sortOrder: 2,
    name: "Popping Boba",
    nameEn: "Popping Boba",
  },
  {
    id: "3",
    slug: "coco-jelly",
    price: 0.5,
    isAvailable: true,
    sortOrder: 3,
    name: "Coco Jelly",
    nameEn: "Coco Jelly",
  },
  {
    id: "4",
    slug: "grass-jelly",
    price: 0.5,
    isAvailable: false,
    sortOrder: 4,
    name: "Grass Jelly",
    nameEn: "Grass Jelly",
  },
  {
    id: "5",
    slug: "aloe-vera",
    price: 0.5,
    isAvailable: true,
    sortOrder: 5,
    name: "Aloë Vera",
    nameEn: "Aloe Vera",
  },
  {
    id: "6",
    slug: "red-bean",
    price: 0.5,
    isAvailable: true,
    sortOrder: 6,
    name: "Rode Bonen",
    nameEn: "Red Bean",
  },
];

type Topping = (typeof sampleToppings)[0];

export default function AdminToppingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [toppings, setToppings] = useState(sampleToppings);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    slug: "",
    price: "",
    name: "",
    nameEn: "",
    isAvailable: true,
    sortOrder: "",
  });

  if (status === "loading") {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-96 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  // Check for SUPER_ADMIN or ADMIN role
  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isAdmin = userRole === "ADMIN" || isSuperAdmin;

  if (status === "unauthenticated" || !isAdmin) {
    router.push("/");
    return null;
  }

  const filteredToppings = toppings
    .filter((topping) => {
      const matchesSearch =
        topping.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topping.slug.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const openAddModal = () => {
    setEditingTopping(null);
    const nextSortOrder = Math.max(...toppings.map((t) => t.sortOrder), 0) + 1;
    setFormData({
      slug: "",
      price: "0.50",
      name: "",
      nameEn: "",
      isAvailable: true,
      sortOrder: nextSortOrder.toString(),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (topping: Topping) => {
    setEditingTopping(topping);
    setFormData({
      slug: topping.slug,
      price: topping.price.toString(),
      name: topping.name,
      nameEn: topping.nameEn,
      isAvailable: topping.isAvailable,
      sortOrder: topping.sortOrder.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // Here you would call tRPC mutation to save the topping
    if (editingTopping) {
      setToppings(
        toppings.map((t) =>
          t.id === editingTopping.id
            ? {
                ...t,
                slug: formData.slug,
                price: parseFloat(formData.price),
                name: formData.name,
                nameEn: formData.nameEn,
                isAvailable: formData.isAvailable,
                sortOrder: parseInt(formData.sortOrder),
              }
            : t
        )
      );
    } else {
      // Add new topping
      const newTopping: Topping = {
        id: Date.now().toString(),
        slug: formData.slug,
        price: parseFloat(formData.price),
        name: formData.name,
        nameEn: formData.nameEn,
        isAvailable: formData.isAvailable,
        sortOrder: parseInt(formData.sortOrder),
      };
      setToppings([...toppings, newTopping]);
    }
    console.log("Saving topping:", formData);
    setIsModalOpen(false);
  };

  const handleDelete = (toppingId: string) => {
    if (!isSuperAdmin) {
      alert("Alleen Super Admins kunnen toppings verwijderen.");
      return;
    }
    if (confirm("Weet je zeker dat je deze topping wilt verwijderen?")) {
      setToppings(toppings.filter((t) => t.id !== toppingId));
    }
  };

  const toggleAvailability = (toppingId: string) => {
    setToppings(
      toppings.map((t) =>
        t.id === toppingId ? { ...t, isAvailable: !t.isAvailable } : t
      )
    );
  };

  const moveTopping = (toppingId: string, direction: "up" | "down") => {
    const sortedToppings = [...toppings].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sortedToppings.findIndex((t) => t.id === toppingId);

    if (direction === "up" && index > 0) {
      const prevOrder = sortedToppings[index - 1].sortOrder;
      const currentOrder = sortedToppings[index].sortOrder;
      setToppings(
        toppings.map((t) => {
          if (t.id === toppingId) return { ...t, sortOrder: prevOrder };
          if (t.id === sortedToppings[index - 1].id) return { ...t, sortOrder: currentOrder };
          return t;
        })
      );
    } else if (direction === "down" && index < sortedToppings.length - 1) {
      const nextOrder = sortedToppings[index + 1].sortOrder;
      const currentOrder = sortedToppings[index].sortOrder;
      setToppings(
        toppings.map((t) => {
          if (t.id === toppingId) return { ...t, sortOrder: nextOrder };
          if (t.id === sortedToppings[index + 1].id) return { ...t, sortOrder: currentOrder };
          return t;
        })
      );
    }
  };

  return (
    <div className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="heading-2">Toppings Beheren</h1>
              <p className="text-muted-foreground">
                {isSuperAdmin
                  ? "Voeg toe, bewerk of verwijder toppings"
                  : "Bekijk en bewerk toppings"}
              </p>
            </div>
          </div>
          {isSuperAdmin && (
            <Button variant="tea" onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Topping
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Zoek op naam of slug..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mb-6 border-tea-200 bg-tea-50">
          <CardContent className="py-4">
            <p className="text-sm text-tea-700">
              <strong>Tip:</strong> Toppings worden automatisch getoond bij alle dranken waar klanten extra&apos;s kunnen toevoegen.
              Gebruik de volgorde knoppen om de weergavevolgorde aan te passen.
            </p>
          </CardContent>
        </Card>

        {/* Toppings List */}
        <div className="space-y-3">
          {filteredToppings.map((topping, index) => (
            <Card
              key={topping.id}
              className={`transition-all ${!topping.isAvailable ? "opacity-60" : ""}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  {/* Sort Handle */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveTopping(topping.id, "up")}
                      disabled={index === 0}
                    >
                      <span className="text-xs">▲</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveTopping(topping.id, "down")}
                      disabled={index === filteredToppings.length - 1}
                    >
                      <span className="text-xs">▼</span>
                    </Button>
                  </div>

                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-taro-100">
                    <Cherry className="h-6 w-6 text-taro-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{topping.name}</h3>
                      {!topping.isAvailable && (
                        <Badge variant="secondary" className="text-xs">
                          Uitgeschakeld
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-mono">{topping.slug}</span>
                      <span>•</span>
                      <span className="font-medium text-tea-600">
                        €{topping.price.toFixed(2)}
                      </span>
                      <span>•</span>
                      <span>Volgorde: {topping.sortOrder}</span>
                    </div>
                  </div>

                  {/* English name */}
                  <div className="hidden text-sm text-muted-foreground md:block">
                    EN: {topping.nameEn}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAvailability(topping.id)}
                      title={topping.isAvailable ? "Uitschakelen" : "Inschakelen"}
                    >
                      {topping.isAvailable ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(topping)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(topping.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredToppings.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Cherry className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">Geen toppings gevonden</p>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Pas je zoekopdracht aan"
                  : "Voeg je eerste topping toe"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Totaal: <strong>{toppings.length}</strong> toppings
              </span>
              <span className="text-muted-foreground">
                Actief: <strong>{toppings.filter((t) => t.isAvailable).length}</strong>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Back to Products Link */}
        <div className="mt-8">
          <Link href="/admin/products">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar Producten
            </Button>
          </Link>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {editingTopping ? "Topping Bewerken" : "Nieuwe Topping"}
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
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    placeholder="popping-boba"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Prijs (EUR)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.10"
                    min="0"
                    placeholder="0.50"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Dutch name */}
              <div className="space-y-2">
                <Label htmlFor="name">Naam (Nederlands)</Label>
                <Input
                  id="name"
                  placeholder="Popping Boba"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* English name */}
              <div className="space-y-2">
                <Label htmlFor="nameEn">Name (English)</Label>
                <Input
                  id="nameEn"
                  placeholder="Popping Boba"
                  value={formData.nameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, nameEn: e.target.value })
                  }
                />
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Volgorde</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Lagere nummers worden eerst getoond
                </p>
              </div>

              {/* Options */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) =>
                    setFormData({ ...formData, isAvailable: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span>Beschikbaar voor klanten</span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Annuleren
                </Button>
                <Button variant="tea" onClick={handleSave}>
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
