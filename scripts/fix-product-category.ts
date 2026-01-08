/**
 * Fix product category to hot-coffee
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const prisma = new PrismaClient();

async function main() {
  // Find the hot-coffee category
  const hotCoffee = await prisma.category.findUnique({
    where: { slug: "hot-coffee" },
    include: { translations: true },
  });

  if (!hotCoffee) {
    console.log("Hot coffee category not found!");
    return;
  }

  console.log("Found hot-coffee category:", hotCoffee.id);

  // Find and update the test product
  const product = await prisma.product.findFirst({
    where: {
      slug: { startsWith: "test-image-goed" },
    },
  });

  if (!product) {
    console.log("Test product not found!");
    return;
  }

  console.log("Found product:", product.slug);
  console.log("Current category:", product.categoryId);

  // Update to hot-coffee
  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { categoryId: hotCoffee.id },
    include: {
      category: { include: { translations: true } },
      translations: true,
    },
  });

  console.log("\nUpdated product:");
  console.log("  Name:", updated.translations.find((t) => t.locale === "nl")?.name);
  console.log("  Category:", updated.category.translations.find((t) => t.locale === "nl")?.name || updated.category.slug);
  console.log("  Image:", updated.imageUrl);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
