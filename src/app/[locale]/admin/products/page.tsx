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
import { ImageUpload } from "@/components/admin/image-upload";
import { api } from "@/lib/trpc";
import { useTranslations } from "next-intl";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Coffee,
  ArrowLeft,
  X,
  Save,
  Eye,
  EyeOff,
  Star,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Product = {
  id: string;
  slug: string;
  price: number | { toNumber: () => number };
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  caffeine: boolean;
  vegan: boolean;
  allowSugarCustomization: boolean;
  allowIceCustomization: boolean;
  allowToppings: boolean;
  categoryId: string;
  translations: { locale: string; name: string; description: string }[];
  category: {
    id: string;
    slug: string;
    translations: { locale: string; name: string }[];
  };
};

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const utils = api.useUtils();
  const t = useTranslations("admin.products");
  const tCommon = useTranslations("common");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    slug: "",
    categoryId: "",
    price: "",
    imageUrl: null as string | null,
    name: "",
    nameEn: "",
    description: "",
    descriptionEn: "",
    isAvailable: true,
    isFeatured: false,
    caffeine: true,
    vegan: false,
    allowSugarCustomization: true,
    allowIceCustomization: true,
    allowToppings: true,
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = api.products.getAll.useQuery({
    locale: "nl",
    onlyAvailable: false,
  });

  // Fetch categories
  const { data: categories } = api.categories.getAll.useQuery({ locale: "nl" });

  // Mutations
  const createMutation = api.products.create.useMutation({
    onSuccess: () => {
      utils.products.getAll.invalidate();
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = api.products.update.useMutation({
    onSuccess: () => {
      utils.products.getAll.invalidate();
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = api.products.delete.useMutation({
    onSuccess: () => {
      utils.products.getAll.invalidate();
    },
  });

  const resetForm = () => {
    setFormData({
      slug: "",
      categoryId: categories?.[0]?.id || "",
      price: "",
      imageUrl: null,
      name: "",
      nameEn: "",
      description: "",
      descriptionEn: "",
      isAvailable: true,
      isFeatured: false,
      caffeine: true,
      vegan: false,
      allowSugarCustomization: true,
      allowIceCustomization: true,
      allowToppings: true,
    });
    setEditingProduct(null);
  };

  if (status === "loading" || productsLoading) {
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

  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isAdmin = userRole === "ADMIN" || isSuperAdmin;

  if (status === "unauthenticated" || !isAdmin) {
    router.push("/");
    return null;
  }

  const filteredProducts = (products || []).filter((product) => {
    const name = product.translations[0]?.name || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    resetForm();
    if (categories?.[0]) {
      setFormData((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    const nlTranslation = product.translations.find((t) => t.locale === "nl");
    const enTranslation = product.translations.find((t) => t.locale === "en");
    const price = typeof product.price === "object" ? product.price.toNumber() : product.price;

    setEditingProduct(product);
    setFormData({
      slug: product.slug,
      categoryId: product.categoryId,
      price: price.toString(),
      imageUrl: product.imageUrl,
      name: nlTranslation?.name || "",
      nameEn: enTranslation?.name || "",
      description: nlTranslation?.description || "",
      descriptionEn: enTranslation?.description || "",
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      caffeine: product.caffeine,
      vegan: product.vegan,
      allowSugarCustomization: product.allowSugarCustomization,
      allowIceCustomization: product.allowIceCustomization,
      allowToppings: product.allowToppings,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (editingProduct) {
      await updateMutation.mutateAsync({
        id: editingProduct.id,
        slug: formData.slug,
        categoryId: formData.categoryId,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl,
        isAvailable: formData.isAvailable,
        isFeatured: formData.isFeatured,
        caffeine: formData.caffeine,
        vegan: formData.vegan,
        allowSugarCustomization: formData.allowSugarCustomization,
        allowIceCustomization: formData.allowIceCustomization,
        allowToppings: formData.allowToppings,
        translations: [
          { locale: "nl" as const, name: formData.name, description: formData.description },
          { locale: "en" as const, name: formData.nameEn, description: formData.descriptionEn },
        ],
      });
    } else {
      await createMutation.mutateAsync({
        slug: formData.slug,
        categoryId: formData.categoryId,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl || undefined,
        isAvailable: formData.isAvailable,
        isFeatured: formData.isFeatured,
        caffeine: formData.caffeine,
        vegan: formData.vegan,
        allowSugarCustomization: formData.allowSugarCustomization,
        allowIceCustomization: formData.allowIceCustomization,
        allowToppings: formData.allowToppings,
        translations: [
          { locale: "nl" as const, name: formData.name, description: formData.description },
          { locale: "en" as const, name: formData.nameEn, description: formData.descriptionEn },
        ],
      });
    }
  };

  const handleDelete = async (productId: string) => {
    if (!isSuperAdmin) {
      alert(t("onlySuperAdminDelete"));
      return;
    }
    if (confirm(t("confirmDelete"))) {
      await deleteMutation.mutateAsync({ id: productId });
    }
  };

  const toggleAvailability = async (product: Product) => {
    await updateMutation.mutateAsync({
      id: product.id,
      isAvailable: !product.isAvailable,
    });
  };

  const toggleFeatured = async (product: Product) => {
    await updateMutation.mutateAsync({
      id: product.id,
      isFeatured: !product.isFeatured,
    });
  };

  const getPrice = (price: unknown): number => {
    if (typeof price === "number") return price;
    if (typeof price === "string") return parseFloat(price);
    if (price && typeof price === "object" && "toNumber" in price) {
      return (price as { toNumber: () => number }).toNumber();
    }
    return Number(price) || 0;
  };

  // Format slug to readable name (e.g., "boba-milk-tea" -> "Boba Milk Tea")
  const formatSlugToName = (slug: string): string => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get product display name - prefer translation, fallback to formatted slug
  const getProductName = (product: Product): string => {
    const translationName = product.translations[0]?.name;
    if (translationName && translationName !== product.slug) {
      return translationName;
    }
    return formatSlugToName(product.slug);
  };

  // Get category display name
  const getCategoryName = (product: Product): string => {
    const translationName = product.category.translations[0]?.name;
    if (translationName && translationName !== product.category.slug) {
      return translationName;
    }
    return formatSlugToName(product.category.slug);
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
              {t("newProduct")}
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "tea" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  {t("all")}
                </Button>
                {categories?.slice(0, 5).map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "tea" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.translations[0]?.name || cat.slug}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`relative ${!product.isAvailable ? "opacity-60" : ""}`}
            >
              <CardContent className="pt-6">
                {/* Status badges */}
                <div className="absolute right-4 top-4 flex gap-2">
                  {product.isFeatured && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  )}
                  {!product.isAvailable && (
                    <Badge variant="secondary">{t("disabled")}</Badge>
                  )}
                </div>

                {/* Product info */}
                <div className="flex items-start gap-4">
                  {product.imageUrl ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-muted">
                      <Image
                        src={product.imageUrl}
                        alt={getProductName(product)}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-tea-100">
                      <Coffee className="h-8 w-8 text-tea-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {getProductName(product)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getCategoryName(product)}
                    </p>
                    <p className="mt-1 text-lg font-bold text-tea-600">
                      €{getPrice(product.price).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                  {product.translations[0]?.description}
                </p>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.caffeine && (
                    <Badge variant="outline" className="text-xs">
                      {t("caffeine")}
                    </Badge>
                  )}
                  {product.vegan && (
                    <Badge variant="outline" className="text-xs">
                      {t("vegan")}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {product.slug}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2 border-t pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAvailability(product)}
                    disabled={updateMutation.isPending}
                  >
                    {product.isAvailable ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFeatured(product)}
                    disabled={updateMutation.isPending}
                  >
                    <Star
                      className={`h-4 w-4 ${product.isFeatured ? "fill-yellow-400 text-yellow-400" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {isSuperAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Coffee className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">{t("noProductsFound")}</p>
              <p className="text-muted-foreground">
                {t("adjustSearch")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Link to Toppings */}
        <div className="mt-8">
          <Link href="/admin/toppings">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="rounded-full bg-taro-100 p-3">
                  <Plus className="h-6 w-6 text-taro-600" />
                </div>
                <div>
                  <p className="font-medium">{t("toppingsManage")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("toppingsDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {editingProduct ? t("editProduct") : t("newProductTitle")}
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
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>{t("productImage")}</Label>
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="products"
                />
                <p className="text-xs text-muted-foreground">
                  {t("imageUploadDesc")}
                </p>
              </div>

              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="slug">{t("slugUrl")}</Label>
                  <Input
                    id="slug"
                    placeholder="taro-milk-tea"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{t("category")}</Label>
                  <select
                    id="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                  >
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.translations[0]?.name || cat.slug}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">{t("priceEur")}</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="5.50"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>

              {/* Dutch translations */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-medium">{t("dutch")}</h4>
                <div className="space-y-2">
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    placeholder="Taro Melkthee"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t("description")}</Label>
                  <Textarea
                    id="description"
                    placeholder="Romige taro melkthee met authentieke smaak"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* English translations */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-medium">{t("english")}</h4>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">Name</Label>
                  <Input
                    id="nameEn"
                    placeholder="Taro Milk Tea"
                    value={formData.nameEn}
                    onChange={(e) =>
                      setFormData({ ...formData, nameEn: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">Description</Label>
                  <Textarea
                    id="descriptionEn"
                    placeholder="Creamy taro milk tea with authentic flavor"
                    value={formData.descriptionEn}
                    onChange={(e) =>
                      setFormData({ ...formData, descriptionEn: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Options */}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) =>
                      setFormData({ ...formData, isAvailable: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>{t("available")}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData({ ...formData, isFeatured: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>{t("featuredHomepage")}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.caffeine}
                    onChange={(e) =>
                      setFormData({ ...formData, caffeine: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>{t("containsCaffeine")}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.vegan}
                    onChange={(e) =>
                      setFormData({ ...formData, vegan: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>{t("vegan")}</span>
                </label>
              </div>

              {/* Customization Options */}
              <div className="space-y-4 rounded-lg border border-tea-200 bg-tea-50 p-4">
                <h4 className="font-medium text-tea-800">{t("customizationOptions")}</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allowSugarCustomization}
                      onChange={(e) =>
                        setFormData({ ...formData, allowSugarCustomization: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>{t("sugarCustomizable")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allowIceCustomization}
                      onChange={(e) =>
                        setFormData({ ...formData, allowIceCustomization: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>{t("iceCustomizable")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allowToppings}
                      onChange={(e) =>
                        setFormData({ ...formData, allowToppings: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>{t("toppingsAddable")}</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("customizationDesc")}
                </p>
              </div>

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
