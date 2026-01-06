import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductModalShell } from "./modal-shell";

// =============================================================================
// SERVER COMPONENT - Data fetching happens here
// =============================================================================

interface Props {
  params: {
    locale: string;
    slug: string;
  };
}

async function getProductData(slug: string, locale: string) {
  const product = await db.product.findUnique({
    where: { slug, isAvailable: true },
    include: {
      translations: { where: { locale } },
      category: {
        include: {
          translations: { where: { locale } },
        },
      },
    },
  });

  if (!product) return null;

  return {
    id: product.id,
    slug: product.slug,
    price: Number(product.price),
    imageUrl: product.imageUrl,
    vegan: product.vegan,
    caffeine: product.caffeine,
    calories: product.calories,
    allowSugarCustomization: product.allowSugarCustomization,
    allowIceCustomization: product.allowIceCustomization,
    allowToppings: product.allowToppings,
    translations: product.translations.map((t) => ({
      name: t.name,
      description: t.description,
    })),
    category: product.category
      ? {
          slug: product.category.slug,
          translations: product.category.translations.map((t) => ({
            name: t.name,
          })),
        }
      : null,
  };
}

async function getCustomizationGroups(locale: string) {
  const groups = await db.customizationGroup.findMany({
    where: { isActive: true },
    include: {
      values: {
        where: { isAvailable: true },
        include: {
          translations: { where: { locale } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return groups.map((group) => ({
    id: group.id,
    type: group.type,
    values: group.values.map((v) => ({
      id: v.id,
      value: v.value,
      priceModifier: Number(v.priceModifier),
      isDefault: v.isDefault,
      translations: v.translations.map((t) => ({
        label: t.label,
      })),
    })),
  }));
}

async function getToppings(locale: string) {
  const toppings = await db.topping.findMany({
    where: { isAvailable: true },
    include: {
      translations: { where: { locale } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return toppings.map((t) => ({
    id: t.id,
    slug: t.slug,
    price: Number(t.price),
    translations: t.translations.map((tr) => ({
      name: tr.name,
    })),
  }));
}

export default async function ProductModalPage({ params }: Props) {
  const { locale, slug } = params;

  // Parallel data fetching for performance
  const [product, customizationGroups, toppings] = await Promise.all([
    getProductData(slug, locale),
    getCustomizationGroups(locale),
    getToppings(locale),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductModalShell
      product={product}
      customizationGroups={customizationGroups}
      toppings={toppings}
    />
  );
}
