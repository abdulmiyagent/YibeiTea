import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  ProductCustomization,
  type ProductData,
  type CustomizationGroup,
  type ToppingData,
} from "@/components/products/product-customization";

// =============================================================================
// SERVER COMPONENT - Full product detail page
// This is shown when:
// 1. User navigates directly to /menu/[slug] (hard navigation)
// 2. User refreshes the page while on /menu/[slug]
// 3. User shares/bookmarks a product URL
// =============================================================================

interface Props {
  params: {
    locale: string;
    slug: string;
  };
}

// -----------------------------------------------------------------------------
// Data Fetching Functions (same as modal, could be extracted to shared lib)
// -----------------------------------------------------------------------------

async function getProductData(slug: string, locale: string): Promise<ProductData | null> {
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

async function getCustomizationGroups(locale: string): Promise<CustomizationGroup[]> {
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

async function getToppings(locale: string): Promise<ToppingData[]> {
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

// -----------------------------------------------------------------------------
// Dynamic Metadata for SEO
// -----------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = params;
  const product = await getProductData(slug, locale);

  if (!product) {
    return {
      title: "Product niet gevonden",
    };
  }

  const name = product.translations[0]?.name || slug;
  const description = product.translations[0]?.description || "";

  return {
    title: name,
    description: description || `Bestel ${name} bij Yibei Tea`,
    openGraph: {
      title: `${name} | Yibei Tea`,
      description: description || `Bestel ${name} bij Yibei Tea`,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default async function ProductDetailPage({ params }: Props) {
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
    <div className="section-padding">
      <div className="container-custom max-w-4xl">
        <ProductCustomization
          product={product}
          customizationGroups={customizationGroups}
          toppings={toppings}
          variant="page"
        />
      </div>
    </div>
  );
}
