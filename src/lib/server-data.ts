// Server-side data fetching functions for Server Components
// These bypass tRPC and call Prisma directly for faster initial page loads

import { db } from "@/lib/db";
import { cache } from "react";

export type Locale = "nl" | "en";

// Featured products with React cache for deduplication
export const getFeaturedProducts = cache(async (locale: Locale, limit = 8) => {
  return db.product.findMany({
    where: { isFeatured: true, isAvailable: true },
    include: {
      translations: { where: { locale } },
      category: {
        include: {
          translations: { where: { locale } },
        },
      },
    },
    take: limit,
    orderBy: { sortOrder: "asc" },
  });
});

// All categories with React cache
export const getCategories = cache(async (locale: Locale) => {
  return db.category.findMany({
    where: { isActive: true },
    include: {
      translations: { where: { locale } },
      _count: {
        select: { products: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
});

// Store settings with React cache
export const getStoreSettings = cache(async () => {
  const settings = await db.storeSettings.findUnique({
    where: { id: "default" },
  });

  const defaultSocialLinks = [
    { platform: "instagram", href: "https://instagram.com/yibeitea", isActive: true },
    { platform: "tiktok", href: "https://tiktok.com/@yibeitea", isActive: true },
    { platform: "facebook", href: "https://facebook.com/yibeitea", isActive: true },
    { platform: "email", href: "mailto:info@yibeitea.be", isActive: true },
  ];

  const defaults = {
    id: "default",
    openingHours: {
      monday: { open: "11:00", close: "20:00" },
      tuesday: { open: "11:00", close: "20:00" },
      wednesday: { open: "11:00", close: "20:00" },
      thursday: { open: "11:00", close: "20:00" },
      friday: { open: "11:00", close: "20:00" },
      saturday: { open: "11:00", close: "20:00" },
      sunday: { open: "10:00", close: "19:00" },
    },
    minPickupMinutes: 15,
    maxAdvanceOrderDays: 7,
    pointsPerEuro: 10,
    slotsPerTimeWindow: 10,
    socialLinks: defaultSocialLinks,
  };

  if (!settings) {
    return defaults;
  }

  return {
    ...settings,
    slotsPerTimeWindow: settings.slotsPerTimeWindow ?? 10,
    socialLinks: settings.socialLinks || defaultSocialLinks,
  };
});

// All available products for menu page
export const getAllProducts = cache(async (locale: Locale) => {
  return db.product.findMany({
    where: { isAvailable: true },
    include: {
      translations: { where: { locale } },
      category: {
        include: {
          translations: { where: { locale } },
        },
      },
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
});

// All toppings for product customization
export const getAllToppings = cache(async (locale: Locale) => {
  return db.topping.findMany({
    where: { isAvailable: true },
    include: {
      translations: { where: { locale } },
    },
    orderBy: { sortOrder: "asc" },
  });
});

// Customization options (sugar levels, ice levels)
export const getCustomizations = cache(async (locale: Locale) => {
  return db.customizationOption.findMany({
    include: {
      translations: { where: { locale } },
    },
    orderBy: { type: "asc" },
  });
});

// Type exports for components
export type FeaturedProduct = Awaited<ReturnType<typeof getFeaturedProducts>>[number];
export type Category = Awaited<ReturnType<typeof getCategories>>[number];
export type StoreSettings = Awaited<ReturnType<typeof getStoreSettings>>;
export type MenuProduct = Awaited<ReturnType<typeof getAllProducts>>[number];
export type Topping = Awaited<ReturnType<typeof getAllToppings>>[number];
export type CustomizationOption = Awaited<ReturnType<typeof getCustomizations>>[number];
