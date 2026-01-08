/**
 * Script to add a test product with background-removed image
 * Run with: npx tsx scripts/add-test-product.ts
 */

import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Load environment variables - try multiple files
const envPath = path.resolve(process.cwd(), ".env.local");
console.log(`Loading env from: ${envPath}`);
const result = config({ path: envPath, override: true });
if (result.error) {
  console.error("Error loading .env.local:", result.error);
}

// Debug: show loaded vars
console.log("Loaded CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "SET" : "NOT SET");

const prisma = new PrismaClient();

// Test image path
const TEST_IMAGE_PATH = "C:/Users/azizg/OneDrive/Desktop/good image.png";

async function main() {
  console.log("=".repeat(60));
  console.log("ADDING TEST PRODUCT");
  console.log("=".repeat(60));

  // 1. Configure Cloudinary
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials not configured");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  // 2. Find the "hot coffee" category
  console.log("\n1. Finding 'hot coffee' category...");

  const categories = await prisma.category.findMany({
    include: {
      translations: true,
    },
  });

  console.log("   Available categories:");
  categories.forEach((cat) => {
    const names = cat.translations.map((t) => `${t.locale}: ${t.name}`).join(", ");
    console.log(`   - ${cat.slug} (${names})`);
  });

  // Find hot coffee category
  const hotCoffeeCategory = categories.find(
    (cat) =>
      cat.slug.toLowerCase().includes("hot-coffee") ||
      cat.slug.toLowerCase().includes("coffee") ||
      cat.translations.some(
        (t) => t.name.toLowerCase().includes("hot coffee") || t.name.toLowerCase().includes("koffie")
      )
  );

  if (!hotCoffeeCategory) {
    console.log("\n   Category 'hot coffee' not found. Creating it...");

    // Create the category
    const newCategoryId = randomUUID();
    const newCategory = await prisma.category.create({
      data: {
        id: newCategoryId,
        slug: "hot-coffee",
        sortOrder: 10,
        isActive: true,
        updatedAt: new Date(),
        translations: {
          create: [
            {
              id: randomUUID(),
              locale: "nl",
              name: "Warme Koffie",
              description: "Onze heerlijke warme koffiedranken",
            },
            {
              id: randomUUID(),
              locale: "en",
              name: "Hot Coffee",
              description: "Our delicious hot coffee drinks",
            },
          ],
        },
      },
      include: {
        translations: true,
      },
    });

    console.log(`   Created category: ${newCategory.slug}`);
    var categoryId = newCategory.id;
  } else {
    console.log(`   Found category: ${hotCoffeeCategory.slug} (ID: ${hotCoffeeCategory.id})`);
    var categoryId = hotCoffeeCategory.id;
  }

  // 3. Upload image to Cloudinary with background removal
  console.log("\n2. Uploading image to Cloudinary with background removal...");

  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    throw new Error(`Test image not found at: ${TEST_IMAGE_PATH}`);
  }

  const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
  console.log(`   Image size: ${imageBuffer.length} bytes`);

  const timestamp = Date.now();
  const publicId = `test-image-goed-${timestamp}`;

  const uploadResult = await new Promise<{
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "yibeitea/products",
        public_id: publicId,
        resource_type: "image",
        format: "png",
        background_removal: "cloudinary_ai",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("No result from Cloudinary"));
          return;
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    uploadStream.end(imageBuffer);
  });

  console.log(`   Upload successful!`);
  console.log(`   URL: ${uploadResult.secure_url}`);
  console.log(`   Dimensions: ${uploadResult.width}x${uploadResult.height}`);

  // 4. Create the product in the database
  console.log("\n3. Creating product in database...");

  const productId = randomUUID();
  const product = await prisma.product.create({
    data: {
      id: productId,
      slug: `test-image-goed-${timestamp}`,
      categoryId: categoryId,
      price: 4.50,
      imageUrl: uploadResult.secure_url,
      isAvailable: true,
      isFeatured: false,
      sortOrder: 0,
      caffeine: true,
      vegan: false,
      allowSugarCustomization: true,
      allowIceCustomization: false, // Hot coffee, no ice
      allowToppings: true,
      updatedAt: new Date(),
      translations: {
        create: [
          {
            id: randomUUID(),
            locale: "nl",
            name: "Test Image Goed",
            description: "Een testproduct met achtergrond verwijdering",
          },
          {
            id: randomUUID(),
            locale: "en",
            name: "Test Image Good",
            description: "A test product with background removal",
          },
        ],
      },
    },
    include: {
      translations: true,
      category: {
        include: {
          translations: true,
        },
      },
    },
  });

  console.log(`   Product created!`);
  console.log(`   ID: ${product.id}`);
  console.log(`   Slug: ${product.slug}`);
  console.log(`   Name (NL): ${product.translations.find((t) => t.locale === "nl")?.name}`);
  console.log(`   Name (EN): ${product.translations.find((t) => t.locale === "en")?.name}`);
  console.log(`   Category: ${product.category.translations.find((t) => t.locale === "nl")?.name}`);
  console.log(`   Price: €${product.price}`);
  console.log(`   Image URL: ${product.imageUrl}`);

  console.log("\n" + "=".repeat(60));
  console.log("PRODUCT ADDED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log(`\nView in admin panel: /admin/products`);
  console.log(`View on menu: /menu`);
}

main()
  .catch((error) => {
    console.error("\nError:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
