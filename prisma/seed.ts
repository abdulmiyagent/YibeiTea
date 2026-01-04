import { PrismaClient, ProductCategory } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    slug: "classic-taro",
    category: "MILK_TEA" as ProductCategory,
    price: 5.5,
    isFeatured: true,
    calories: 280,
    caffeine: true,
    vegan: false,
    translations: {
      nl: { name: "Classic Taro Milk Tea", description: "Romige taro melkthee met verse tapioca parels" },
      en: { name: "Classic Taro Milk Tea", description: "Creamy taro milk tea with fresh tapioca pearls" },
    },
  },
  {
    slug: "brown-sugar-boba",
    category: "BUBBLE_TEA" as ProductCategory,
    price: 5.5,
    isFeatured: true,
    calories: 320,
    caffeine: true,
    vegan: false,
    translations: {
      nl: { name: "Brown Sugar Boba", description: "Klassieke melkthee met bruine suiker siroop en boba" },
      en: { name: "Brown Sugar Boba", description: "Classic milk tea with brown sugar syrup and boba" },
    },
  },
  {
    slug: "matcha-latte",
    category: "MILK_TEA" as ProductCategory,
    price: 5.5,
    isFeatured: true,
    calories: 220,
    caffeine: true,
    vegan: false,
    translations: {
      nl: { name: "Matcha Latte", description: "Premium Japanse matcha met romige melk" },
      en: { name: "Matcha Latte", description: "Premium Japanese matcha with creamy milk" },
    },
  },
  {
    slug: "passion-fruit-tea",
    category: "BUBBLE_TEA" as ProductCategory,
    price: 5.5,
    isFeatured: false,
    calories: 180,
    caffeine: true,
    vegan: true,
    translations: {
      nl: { name: "Passievrucht Thee", description: "Verfrissende thee met passievrucht en fruit jellies" },
      en: { name: "Passion Fruit Tea", description: "Refreshing tea with passion fruit and fruit jellies" },
    },
  },
  {
    slug: "strawberry-ice",
    category: "ICED_TEA" as ProductCategory,
    price: 5.5,
    isFeatured: true,
    calories: 160,
    caffeine: true,
    vegan: true,
    translations: {
      nl: { name: "Strawberry Iced Tea", description: "Zoete aardbeien thee met verse aardbeien stukjes" },
      en: { name: "Strawberry Iced Tea", description: "Sweet strawberry tea with fresh strawberry pieces" },
    },
  },
  {
    slug: "green-apple-ice",
    category: "ICED_TEA" as ProductCategory,
    price: 5.5,
    isFeatured: false,
    calories: 150,
    caffeine: true,
    vegan: true,
    translations: {
      nl: { name: "Green Apple Iced Tea", description: "Verfrissende groene appel thee met ijs" },
      en: { name: "Green Apple Iced Tea", description: "Refreshing green apple tea with ice" },
    },
  },
  {
    slug: "caramel-vanilla",
    category: "ICED_COFFEE" as ProductCategory,
    price: 5.5,
    isFeatured: true,
    calories: 280,
    caffeine: true,
    vegan: false,
    translations: {
      nl: { name: "Caramel Vanilla Coffee", description: "Ijskoffie met karamel en vanille smaak" },
      en: { name: "Caramel Vanilla Coffee", description: "Iced coffee with caramel and vanilla flavor" },
    },
  },
  {
    slug: "hazelnut-nutella",
    category: "ICED_COFFEE" as ProductCategory,
    price: 5.5,
    isFeatured: false,
    calories: 340,
    caffeine: true,
    vegan: false,
    translations: {
      nl: { name: "Hazelnut Nutella Coffee", description: "Romige ijskoffie met hazelnoot en Nutella" },
      en: { name: "Hazelnut Nutella Coffee", description: "Creamy iced coffee with hazelnut and Nutella" },
    },
  },
  {
    slug: "blue-ocean",
    category: "MOJITO" as ProductCategory,
    price: 6.0,
    isFeatured: false,
    calories: 120,
    caffeine: false,
    vegan: true,
    translations: {
      nl: { name: "Blue Ocean Mojito", description: "Verfrissende blauwe cocktail met munt en limoen" },
      en: { name: "Blue Ocean Mojito", description: "Refreshing blue cocktail with mint and lime" },
    },
  },
  {
    slug: "peach-garden",
    category: "MOJITO" as ProductCategory,
    price: 6.0,
    isFeatured: true,
    calories: 130,
    caffeine: false,
    vegan: true,
    translations: {
      nl: { name: "Peach Garden Mojito", description: "Zoete perzik mojito met verse munt" },
      en: { name: "Peach Garden Mojito", description: "Sweet peach mojito with fresh mint" },
    },
  },
  {
    slug: "tokyo-kiwi",
    category: "MOJITO" as ProductCategory,
    price: 6.0,
    isFeatured: false,
    calories: 125,
    caffeine: false,
    vegan: true,
    translations: {
      nl: { name: "Tokyo Kiwi Mojito", description: "Exotische kiwi mojito met Japanse twist" },
      en: { name: "Tokyo Kiwi Mojito", description: "Exotic kiwi mojito with Japanese twist" },
    },
  },
];

async function main() {
  console.log("Seeding database...");

  // Create products
  for (const product of products) {
    const { translations, ...data } = product;

    await prisma.product.upsert({
      where: { slug: data.slug },
      update: data,
      create: {
        ...data,
        translations: {
          create: [
            { locale: "nl", name: translations.nl.name, description: translations.nl.description },
            { locale: "en", name: translations.en.name, description: translations.en.description },
          ],
        },
      },
    });

    console.log(`Created product: ${data.slug}`);
  }

  // Create store settings
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      openingHours: {
        monday: { open: "11:00", close: "20:00" },
        tuesday: { open: "11:00", close: "20:00" },
        wednesday: { open: "11:00", close: "20:00" },
        thursday: { open: "11:00", close: "20:00" },
        friday: { open: "11:00", close: "21:00" },
        saturday: { open: "11:00", close: "21:00" },
        sunday: { open: "12:00", close: "19:00" },
      },
      minPickupMinutes: 15,
      maxAdvanceOrderDays: 7,
      pointsPerEuro: 10,
    },
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
