/**
 * Crop product images from screenshots and upload to Cloudinary
 */

import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const SCREENSHOTS_DIR = path.join(process.cwd(), "scraped-images", "screenshots");
const CROPPED_DIR = path.join(process.cwd(), "scraped-images", "cropped");

// Define crop regions from google-image-01.png (1920x1080 screenshot)
// Each region represents an individual product image in the grid
interface CropRegion {
  name: string;
  productSlug: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Based on testing - grid starts at y≈220, columns at x≈55, 175, 295, 415, 535, 655
// Thumbnails are ~110x140
const CROP_REGIONS: CropRegion[] = [
  // Row 1 (y≈220) - First row of product thumbnails
  { name: "brown-sugar-boba", productSlug: "boba-milk-tea", x: 295, y: 220, width: 110, height: 140 },
  { name: "boba-clear-hand", productSlug: "fresh-milk", x: 415, y: 220, width: 110, height: 140 },
  { name: "passion-fruit-tea", productSlug: "ice-tea-passion-fruit", x: 655, y: 220, width: 110, height: 140 },

  // Row 2 (y≈370) - Second row
  { name: "taro-purple", productSlug: "cream-cheese-taro-milk", x: 175, y: 370, width: 110, height: 140 },
  { name: "fruit-tea-yellow", productSlug: "honey-milk-tea", x: 295, y: 370, width: 110, height: 140 },
  { name: "matcha-kiwi", productSlug: "cream-cheese-matcha", x: 415, y: 370, width: 110, height: 140 },
  { name: "brown-taro-mix", productSlug: "thai-tea", x: 535, y: 370, width: 110, height: 140 },
  { name: "iced-coffee", productSlug: "boba-coffee", x: 655, y: 370, width: 110, height: 140 },

  // Row 3 (y≈520)
  { name: "brown-sugar-2", productSlug: "brown-sugar-matcha-milk", x: 175, y: 520, width: 110, height: 140 },
  { name: "fruit-tea-orange", productSlug: "ice-tea-lemon", x: 295, y: 520, width: 110, height: 140 },
  { name: "green-drink", productSlug: "cream-cheese-green-tea", x: 535, y: 520, width: 110, height: 140 },

  // Row 4 (y≈670)
  { name: "handheld-milk-tea", productSlug: "salted-caramel-milk-tea", x: 175, y: 670, width: 110, height: 140 },
];

async function ensureDirectories() {
  if (!fs.existsSync(CROPPED_DIR)) {
    fs.mkdirSync(CROPPED_DIR, { recursive: true });
  }
}

async function cropImage(
  sourcePath: string,
  outputPath: string,
  region: CropRegion
): Promise<boolean> {
  try {
    await sharp(sourcePath)
      .extract({
        left: region.x,
        top: region.y,
        width: region.width,
        height: region.height,
      })
      .resize(400, 400, { fit: "cover" })
      .png()
      .toFile(outputPath);

    console.log(`   ✅ Cropped: ${region.name}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to crop ${region.name}:`, error);
    return false;
  }
}

async function uploadToCloudinary(
  filepath: string,
  publicId: string
): Promise<string | null> {
  try {
    console.log(`   📤 Uploading ${publicId} with background removal...`);

    const result = await cloudinary.uploader.upload(filepath, {
      folder: "yibeitea/products",
      public_id: publicId,
      resource_type: "image",
      format: "png",
      background_removal: "cloudinary_ai",
    });

    console.log(`   ✅ Uploaded: ${result.secure_url.substring(0, 60)}...`);
    return result.secure_url;
  } catch (error) {
    console.warn(`   ⚠️ Background removal failed, trying without...`);

    try {
      const result = await cloudinary.uploader.upload(filepath, {
        folder: "yibeitea/products",
        public_id: publicId,
        resource_type: "image",
        format: "png",
      });

      console.log(`   ✅ Uploaded (no bg removal): ${result.secure_url.substring(0, 60)}...`);
      return result.secure_url;
    } catch (e) {
      console.error(`   ❌ Upload failed:`, e);
      return null;
    }
  }
}

async function updateProductInDb(slug: string, imageUrl: string): Promise<boolean> {
  try {
    const result = await prisma.product.updateMany({
      where: { slug },
      data: { imageUrl },
    });

    if (result.count > 0) {
      console.log(`   💾 Updated database for: ${slug}`);
      return true;
    } else {
      console.log(`   ⚠️ No product found with slug: ${slug}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Database update failed:`, error);
    return false;
  }
}

const PUBLIC_PRODUCTS_DIR = path.join(process.cwd(), "public", "images", "products");

async function copyToPublic(croppedPath: string, productSlug: string): Promise<string> {
  const destPath = path.join(PUBLIC_PRODUCTS_DIR, `${productSlug}.png`);
  fs.copyFileSync(croppedPath, destPath);
  return `/images/products/${productSlug}.png`;
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     Crop & Save Product Images                             ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  await ensureDirectories();

  // Source screenshot
  const sourceImage = path.join(SCREENSHOTS_DIR, "google-image-01.png");

  if (!fs.existsSync(sourceImage)) {
    console.error(`❌ Source image not found: ${sourceImage}`);
    console.log("   Please run the scraper first to generate screenshots.");
    process.exit(1);
  }

  console.log(`📂 Source: ${sourceImage}\n`);
  console.log(`🔄 Processing ${CROP_REGIONS.length} product images...\n`);

  const results: { slug: string; url: string }[] = [];
  const skipCloudinary = true; // Cloudinary is disabled

  for (const region of CROP_REGIONS) {
    console.log(`\n📦 Processing: ${region.name} -> ${region.productSlug}`);

    const croppedPath = path.join(CROPPED_DIR, `${region.name}.png`);

    // Step 1: Crop
    const cropped = await cropImage(sourceImage, croppedPath, region);
    if (!cropped) continue;

    let imageUrl: string | null = null;

    if (skipCloudinary) {
      // Copy directly to public folder
      imageUrl = await copyToPublic(croppedPath, region.productSlug);
      console.log(`   📁 Copied to: ${imageUrl}`);
    } else {
      // Upload to Cloudinary
      imageUrl = await uploadToCloudinary(croppedPath, region.productSlug);
    }

    if (!imageUrl) continue;

    // Step 3: Update database
    await updateProductInDb(region.productSlug, imageUrl);

    results.push({ slug: region.productSlug, url: imageUrl });
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║     Summary                                                 ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`✅ Successfully processed: ${results.length}/${CROP_REGIONS.length} images\n`);

  if (results.length > 0) {
    console.log("Updated products:");
    for (const r of results) {
      console.log(`   - ${r.slug}: ${r.url.substring(0, 50)}...`);
    }
  }

  console.log(`\n📁 Cropped images saved to: ${CROPPED_DIR}`);

  await prisma.$disconnect();
}

main().catch(console.error);
