"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  Cherry,
  Loader2,
  GripVertical,
} from "lucide-react";
import Link from "next/link";

type Topping = {
  id: string;
  slug: string;
  price: number | { toNumber: () => number };
  isAvailable: boolean;
  sortOrder: number;
  translations: { locale: string; name: string }[];
};

// Sortable topping item component
function SortableToppingItem({
  topping,
  isSuperAdmin,
  onToggleAvailability,
  onEdit,
  onDelete,
  getPrice,
  isUpdating,
}: {
  topping: Topping;
  isSuperAdmin: boolean;
  onToggleAvailability: (topping: Topping) => void;
  onEdit: (topping: Topping) => void;
  onDelete: (id: string) => void;
  getPrice: (price: unknown) => number;
  isUpdating: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topping.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all ${!topping.isAvailable ? "opacity-60" : ""} ${isDragging ? "shadow-lg ring-2 ring-tea-500" : ""}`}
    >
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none rounded p-1 hover:bg-muted active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-taro-100">
            <Cherry className="h-6 w-6 text-taro-600" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">
                {topping.translations[0]?.name || topping.slug}
              </h3>
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
                €{getPrice(topping.price).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleAvailability(topping)}
              title={topping.isAvailable ? "Uitschakelen" : "Inschakelen"}
              disabled={isUpdating}
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
              onClick={() => onEdit(topping)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {isSuperAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(topping.id)}
                disabled={isUpdating}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminToppingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const utils = api.useUtils();
  const t = useTranslations("admin.toppings");
  const tCommon = useTranslations("common");

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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch toppings from database
  const { data: toppings, isLoading: toppingsLoading } = api.toppings.getAll.useQuery({
    locale: "nl",
    onlyAvailable: false,
  });

  // Mutations
  const createMutation = api.toppings.create.useMutation({
    onSuccess: () => {
      utils.toppings.getAll.invalidate();
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = api.toppings.update.useMutation({
    onSuccess: () => {
      utils.toppings.getAll.invalidate();
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = api.toppings.delete.useMutation({
    onSuccess: () => {
      utils.toppings.getAll.invalidate();
    },
  });

  const resetForm = () => {
    setFormData({
      slug: "",
      price: "0.50",
      name: "",
      nameEn: "",
      isAvailable: true,
      sortOrder: "",
    });
    setEditingTopping(null);
  };

  if (status === "loading" || toppingsLoading) {
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

  // Check for SUPER_ADMIN or ADMIN role
  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isAdmin = userRole === "ADMIN" || isSuperAdmin;

  if (status === "unauthenticated" || !isAdmin) {
    router.push("/");
    return null;
  }

  const getPrice = (price: unknown): number => {
    if (typeof price === "number") return price;
    if (typeof price === "string") return parseFloat(price);
    if (price && typeof price === "object" && "toNumber" in price) {
      return (price as { toNumber: () => number }).toNumber();
    }
    return Number(price) || 0;
  };

  const sortedToppings = [...(toppings || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const filteredToppings = sortedToppings.filter((topping) => {
    const name = topping.translations[0]?.name || topping.slug;
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topping.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedToppings.findIndex((t) => t.id === active.id);
      const newIndex = sortedToppings.findIndex((t) => t.id === over.id);

      const newOrder = arrayMove(sortedToppings, oldIndex, newIndex);

      // Update sort orders in database
      const updates = newOrder.map((topping, index) => ({
        id: topping.id,
        sortOrder: index + 1,
      }));

      // Update all affected toppings
      for (const update of updates) {
        if (sortedToppings.find((t) => t.id === update.id)?.sortOrder !== update.sortOrder) {
          await updateMutation.mutateAsync(update);
        }
      }
    }
  };

  const openAddModal = () => {
    resetForm();
    const nextSortOrder = Math.max(...(toppings || []).map((t) => t.sortOrder), 0) + 1;
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
    const nlTranslation = topping.translations.find((t) => t.locale === "nl");
    const enTranslation = topping.translations.find((t) => t.locale === "en");

    setEditingTopping(topping);
    setFormData({
      slug: topping.slug,
      price: getPrice(topping.price).toString(),
      name: nlTranslation?.name || "",
      nameEn: enTranslation?.name || "",
      isAvailable: topping.isAvailable,
      sortOrder: topping.sortOrder.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (editingTopping) {
      await updateMutation.mutateAsync({
        id: editingTopping.id,
        slug: formData.slug,
        price: parseFloat(formData.price),
        isAvailable: formData.isAvailable,
        sortOrder: parseInt(formData.sortOrder),
        translations: [
          { locale: "nl" as const, name: formData.name },
          { locale: "en" as const, name: formData.nameEn || formData.name },
        ],
      });
    } else {
      await createMutation.mutateAsync({
        slug: formData.slug,
        price: parseFloat(formData.price),
        isAvailable: formData.isAvailable,
        sortOrder: parseInt(formData.sortOrder),
        translations: [
          { locale: "nl" as const, name: formData.name },
          { locale: "en" as const, name: formData.nameEn || formData.name },
        ],
      });
    }
  };

  const handleDelete = async (toppingId: string) => {
    if (!isSuperAdmin) {
      alert(t("onlySuperAdminDelete"));
      return;
    }
    if (confirm(t("confirmDelete"))) {
      await deleteMutation.mutateAsync({ id: toppingId });
    }
  };

  const toggleAvailability = async (topping: Topping) => {
    await updateMutation.mutateAsync({
      id: topping.id,
      isAvailable: !topping.isAvailable,
    });
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
              <h1 className="heading-2">{t("manage")}</h1>
              <p className="text-muted-foreground">
                {isSuperAdmin
                  ? t("addEditDeleteDesc")
                  : t("viewEdit")}
              </p>
            </div>
          </div>
          {isSuperAdmin && (
            <Button variant="tea" onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              {t("newTopping")}
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
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
              <strong>Tip:</strong> {t("dragTip")}
            </p>
          </CardContent>
        </Card>

        {/* Toppings List with Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredToppings.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {filteredToppings.map((topping) => (
                <SortableToppingItem
                  key={topping.id}
                  topping={topping}
                  isSuperAdmin={isSuperAdmin}
                  onToggleAvailability={toggleAvailability}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  getPrice={getPrice}
                  isUpdating={updateMutation.isPending || deleteMutation.isPending}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {filteredToppings.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Cherry className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">{t("noToppingsFound")}</p>
              <p className="text-muted-foreground">
                {searchQuery
                  ? t("adjustSearch")
                  : t("addFirst")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("total")}: <strong>{(toppings || []).length}</strong> {t("toppings")}
              </span>
              <span className="text-muted-foreground">
                {t("active")}: <strong>{(toppings || []).filter((t) => t.isAvailable).length}</strong>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Back to Products Link */}
        <div className="mt-8">
          <Link href="/admin/products">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToProducts")}
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
                {editingTopping ? t("editTopping") : t("newToppingTitle")}
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
                  <Label htmlFor="slug">{t("slugUrl")}</Label>
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
                  <Label htmlFor="price">{t("priceEur")}</Label>
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
                <Label htmlFor="name">{t("nameDutch")}</Label>
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
                <Label htmlFor="nameEn">{t("nameEnglish")}</Label>
                <Input
                  id="nameEn"
                  placeholder="Popping Boba"
                  value={formData.nameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, nameEn: e.target.value })
                  }
                />
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
                <span>{t("availableForCustomers")}</span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  {tCommon("cancel")}
                </Button>
                <Button
                  variant="tea"
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  {t("save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
