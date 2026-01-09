"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";
import { getDisplayName } from "@/lib/utils";
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
  ArrowLeft,
  X,
  Save,
  Eye,
  EyeOff,
  FolderOpen,
  GripVertical,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

type Category = {
  id: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  translations: { locale: string; name: string; description: string | null }[];
  _count: { products: number };
};

type CategoryFormData = {
  slug: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string;
  nameNl: string;
  nameEn: string;
  descriptionNl: string;
  descriptionEn: string;
};

const initialFormData: CategoryFormData = {
  slug: "",
  sortOrder: 0,
  isActive: true,
  imageUrl: "",
  nameNl: "",
  nameEn: "",
  descriptionNl: "",
  descriptionEn: "",
};

// Sortable category item component
function SortableCategoryItem({
  category,
  onToggleActive,
  onEdit,
  onDelete,
  deleteConfirmId,
  setDeleteConfirmId,
  isUpdating,
  isDeleting,
}: {
  category: Category;
  onToggleActive: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const nlTranslation = category.translations.find((t) => t.locale === "nl");
  const enTranslation = category.translations.find((t) => t.locale === "en");

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`relative transition-all ${!category.isActive ? "opacity-60" : ""} ${isDragging ? "shadow-lg ring-2 ring-tea-500" : ""}`}
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

          {/* Category Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">
                {getDisplayName(nlTranslation?.name, category.slug)}
              </h3>
              <span className="text-sm text-muted-foreground">
                ({enTranslation?.name || "-"})
              </span>
              {!category.isActive && (
                <Badge variant="secondary">Inactief</Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{category.slug}</span>
              <span>•</span>
              <span>{category._count.products} producten</span>
            </div>
            {nlTranslation?.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                {nlTranslation.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleActive(category)}
              title={category.isActive ? "Deactiveren" : "Activeren"}
              disabled={isUpdating}
            >
              {category.isActive ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {category._count.products === 0 ? (
              deleteConfirmId === category.id ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(category.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Ja"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    Nee
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteConfirmId(category.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled
                title="Kan niet verwijderen: bevat producten"
                className="opacity-30"
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

export default function AdminCategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [formError, setFormError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  // Fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = api.categories.getAll.useQuery(
    { includeInactive: true },
    { enabled: status === "authenticated" }
  );

  // Mutations
  const createMutation = api.categories.create.useMutation({
    onSuccess: () => {
      setIsModalOpen(false);
      setFormData(initialFormData);
      setFormError("");
      refetchCategories();
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const updateMutation = api.categories.update.useMutation({
    onSuccess: () => {
      setIsModalOpen(false);
      setEditingCategoryId(null);
      setFormData(initialFormData);
      setFormError("");
      refetchCategories();
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const deleteMutation = api.categories.delete.useMutation({
    onSuccess: () => {
      setDeleteConfirmId(null);
      refetchCategories();
    },
    onError: (error) => {
      alert(error.message);
      setDeleteConfirmId(null);
    },
  });

  if (status === "loading" || categoriesLoading) {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        </div>
      </div>
    );
  }

  // Only SUPER_ADMIN can access this page
  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  if (status === "unauthenticated" || !isSuperAdmin) {
    router.push("/admin");
    return null;
  }

  const sortedCategories = [...(categories || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedCategories.findIndex((c) => c.id === active.id);
      const newIndex = sortedCategories.findIndex((c) => c.id === over.id);

      const newOrder = arrayMove(sortedCategories, oldIndex, newIndex);

      // Update sort orders in database
      for (let i = 0; i < newOrder.length; i++) {
        const category = newOrder[i];
        if (category.sortOrder !== i + 1) {
          const nlTranslation = category.translations.find((t) => t.locale === "nl");
          const enTranslation = category.translations.find((t) => t.locale === "en");

          await updateMutation.mutateAsync({
            id: category.id,
            sortOrder: i + 1,
            translations: [
              { locale: "nl" as const, name: nlTranslation?.name || "", description: nlTranslation?.description || undefined },
              { locale: "en" as const, name: enTranslation?.name || "", description: enTranslation?.description || undefined },
            ],
          });
        }
      }
    }
  };

  const openAddModal = () => {
    setEditingCategoryId(null);
    setFormData({
      ...initialFormData,
      sortOrder: (categories?.length || 0) + 1,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategoryId(category.id);
    const nlTranslation = category.translations.find((t) => t.locale === "nl");
    const enTranslation = category.translations.find((t) => t.locale === "en");

    setFormData({
      slug: category.slug,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      imageUrl: category.imageUrl || "",
      nameNl: nlTranslation?.name || "",
      nameEn: enTranslation?.name || "",
      descriptionNl: nlTranslation?.description || "",
      descriptionEn: enTranslation?.description || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // Validate
    if (!formData.slug.trim()) {
      setFormError("Slug is verplicht");
      return;
    }
    if (!formData.nameNl.trim() || !formData.nameEn.trim()) {
      setFormError("Naam in beide talen is verplicht");
      return;
    }

    const translations = [
      { locale: "nl" as const, name: formData.nameNl, description: formData.descriptionNl || undefined },
      { locale: "en" as const, name: formData.nameEn, description: formData.descriptionEn || undefined },
    ];

    if (editingCategoryId) {
      updateMutation.mutate({
        id: editingCategoryId,
        slug: formData.slug,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
        imageUrl: formData.imageUrl || null,
        translations,
      });
    } else {
      createMutation.mutate({
        slug: formData.slug,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
        imageUrl: formData.imageUrl || null,
        translations,
      });
    }
  };

  const handleDelete = (categoryId: string) => {
    deleteMutation.mutate({ id: categoryId });
  };

  const toggleActive = (category: Category) => {
    const nlTranslation = category.translations.find((t) => t.locale === "nl");
    const enTranslation = category.translations.find((t) => t.locale === "en");

    updateMutation.mutate({
      id: category.id,
      isActive: !category.isActive,
      translations: [
        { locale: "nl" as const, name: nlTranslation?.name || "", description: nlTranslation?.description || undefined },
        { locale: "en" as const, name: enTranslation?.name || "", description: enTranslation?.description || undefined },
      ],
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
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
              <h1 className="heading-2">Categorieën Beheren</h1>
              <p className="text-muted-foreground">
                Voeg toe, bewerk of verwijder productcategorieën
              </p>
            </div>
          </div>
          <Button variant="tea" onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Categorie
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-tea-200 bg-tea-50">
          <CardContent className="py-4">
            <p className="text-sm text-tea-700">
              <strong>Tip:</strong> Sleep categorieën met het <GripVertical className="inline h-4 w-4" /> icoon om de menu volgorde aan te passen.
            </p>
          </CardContent>
        </Card>

        {/* Categories List with Drag and Drop */}
        {categories && categories.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {sortedCategories.map((category) => (
                  <SortableCategoryItem
                    key={category.id}
                    category={category}
                    onToggleActive={toggleActive}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    deleteConfirmId={deleteConfirmId}
                    setDeleteConfirmId={setDeleteConfirmId}
                    isUpdating={updateMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">Geen categorieën gevonden</p>
              <p className="text-muted-foreground">
                Voeg je eerste categorie toe om te beginnen
              </p>
              <Button variant="tea" className="mt-4" onClick={openAddModal}>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe Categorie
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {editingCategoryId ? "Categorie Bewerken" : "Nieuwe Categorie"}
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
              {formError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {formError}
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  placeholder="brown-sugar"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Alleen kleine letters, cijfers en streepjes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Afbeelding URL (optioneel)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                />
              </div>

              {/* Dutch */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-medium">Nederlands</h4>
                <div className="space-y-2">
                  <Label htmlFor="nameNl">Naam *</Label>
                  <Input
                    id="nameNl"
                    placeholder="Brown Sugar"
                    value={formData.nameNl}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        nameNl: name,
                        slug: !editingCategoryId && !formData.slug ? generateSlug(name) : formData.slug,
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionNl">Beschrijving (optioneel)</Label>
                  <Textarea
                    id="descriptionNl"
                    placeholder="Met verse tapioca parels"
                    value={formData.descriptionNl}
                    onChange={(e) =>
                      setFormData({ ...formData, descriptionNl: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* English */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-medium">English</h4>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">Name *</Label>
                  <Input
                    id="nameEn"
                    placeholder="Brown Sugar"
                    value={formData.nameEn}
                    onChange={(e) =>
                      setFormData({ ...formData, nameEn: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">Description (optional)</Label>
                  <Textarea
                    id="descriptionEn"
                    placeholder="With fresh tapioca pearls"
                    value={formData.descriptionEn}
                    onChange={(e) =>
                      setFormData({ ...formData, descriptionEn: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Options */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span>Actief (zichtbaar in menu)</span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Annuleren
                </Button>
                <Button
                  variant="tea"
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
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
