/**
 * Download product images and upload to Cloudinary
 *
 * This script:
 * 1. Uses Puppeteer to download full-size images from Google Images
 * 2. Saves them locally
 * 3. Uploads to Cloudinary with background removal
 * 4. Updates the product database
 */

import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const OUTPUT_DIR = path.join(process.cwd(), "scraped-images", "products");

// Products that need images (have SVG placeholders)
const PRODUCTS_NEEDING_IMAGES = [
  { slug: "boba-milk-tea", searchTerm: "brown sugar boba milk tea tiger stripes", priority: 1 },
  { slug: "boba-coffee", searchTerm: "brown sugar boba coffee", priority: 2 },
  { slug: "brown-sugar-matcha-milk", searchTerm: "brown sugar matcha milk boba", priority: 2 },
  { slug: "indian-chai", searchTerm: "indian chai latte bubble tea", priority: 3 },
  { slug: "thai-tea", searchTerm: "thai milk tea orange bubble tea", priority: 2 },
  { slug: "singapore-tea", searchTerm: "singapore milk tea", priority: 3 },
  { slug: "salted-caramel-milk-tea", searchTerm: "salted caramel milk tea boba", priority: 3 },
  { slug: "cream-cheese-green-tea", searchTerm: "cream cheese green tea bubble tea", priority: 2 },
  { slug: "cream-cheese-matcha", searchTerm: "cream cheese matcha bubble tea", priority: 2 },
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.error(`Failed to download ${url}:`, error);
    return false;
  }
}

async function uploadToCloudinary(
  filepath: string,
  productSlug: string
): Promise<string | null> {
  try {
    const result = await cloudinary.uploader.upload(filepath, {
      folder: "yibeitea/products",
      public_id: productSlug,
      resource_type: "image",
      format: "png",
      background_removal: "cloudinary_ai",
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${productSlug}:`, error);
    // Try without background removal
    try {
      const result = await cloudinary.uploader.upload(filepath, {
        folder: "yibeitea/products",
        public_id: productSlug,
        resource_type: "image",
        format: "png",
      });
      return result.secure_url;
    } catch (e) {
      console.error(`Upload without bg removal also failed:`, e);
      return null;
    }
  }
}

async function updateProductImage(slug: string, imageUrl: string): Promise<void> {
  await prisma.product.updateMany({
    where: { slug },
    data: { imageUrl },
  });
  console.log(`✅ Updated product ${slug} with new image`);
}

async function scrapeAndDownloadImages() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     Yibei Tea - Image Downloader & Uploader                ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: false,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1920,1080"],
    defaultViewport: { width: 1920, height: 1080 },
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // First, accept cookies on Google
    console.log("🍪 Accepting Google cookies...");
    await page.goto("https://www.google.com", { waitUntil: "networkidle2" });
    await delay(2000);

    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        for (const btn of buttons) {
          if (btn.textContent?.toLowerCase().includes('accept all') ||
              btn.textContent?.toLowerCase().includes('alles accepteren')) {
            btn.click();
            return;
          }
        }
      });
      await delay(2000);
    } catch {
      // Continue
    }

    // Search for Yibei Tea Gent products
    console.log("\n📍 Searching for Yibei Tea product images...\n");

    await page.goto("https://www.google.com/search?q=Yibei+Tea+Gent+bubble+tea+drinks&tbm=isch", {
      waitUntil: "networkidle2",
    });
    await delay(3000);

    // Collect image URLs
    const imageUrls: string[] = [];

    // Click on images and extract full-size URLs
    for (let i = 0; i < 20; i++) {
      try {
        // Find all image thumbnails
        const thumbnails = await page.$$('img[data-src], div[data-id] img');

        if (thumbnails[i]) {
          await thumbnails[i].click();
          await delay(2000);

          // Try to get the full-size image URL
          const fullSizeUrl = await page.evaluate(() => {
            // Look for the large image in the side panel
            const largeImg = document.querySelector('img[data-noaft="1"]') as HTMLImageElement;
            if (largeImg && largeImg.src && largeImg.src.startsWith('http')) {
              return largeImg.src;
            }
            // Alternative selector
            const altImg = document.querySelector('a[href*="imgurl="] img') as HTMLImageElement;
            if (altImg && altImg.src) {
              return altImg.src;
            }
            return null;
          });

          if (fullSizeUrl && !imageUrls.includes(fullSizeUrl)) {
            imageUrls.push(fullSizeUrl);
            console.log(`   Found image ${imageUrls.length}: ${fullSizeUrl.substring(0, 60)}...`);
          }

          // Press Escape to close
          await page.keyboard.press('Escape');
          await delay(500);
        }
      } catch {
        // Continue to next image
      }
    }

    console.log(`\n📊 Found ${imageUrls.length} unique images\n`);

    // Download and save images
    console.log("📥 Downloading images...\n");

    for (let i = 0; i < Math.min(imageUrls.length, 10); i++) {
      const url = imageUrls[i];
      const filename = `product-${i.toString().padStart(2, "0")}.jpg`;
      const filepath = path.join(OUTPUT_DIR, filename);

      const success = await downloadImage(url, filepath);
      if (success) {
        console.log(`   ✅ Downloaded: ${filename}`);
      } else {
        console.log(`   ❌ Failed: ${filename}`);
      }
    }

    // Take a screenshot showing available images
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "available-images.png"),
      fullPage: false,
    });

    console.log("\n📸 Screenshot saved showing available images");
    console.log(`\n📁 Images saved to: ${OUTPUT_DIR}`);

    // Keep browser open for manual inspection
    console.log("\n⏳ Browser stays open for 30 seconds...");
    console.log("   You can manually download additional images if needed.\n");
    await delay(30000);

  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

// Alternative: Upload existing local images
async function uploadLocalImages() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     Upload Local Images to Cloudinary                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Check if we have downloaded images
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log("❌ No downloaded images found. Run scrapeAndDownloadImages first.");
    return;
  }

  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Found ${files.length} images to process\n`);

  for (const file of files) {
    const filepath = path.join(OUTPUT_DIR, file);
    const slug = file.replace(/\.[^.]+$/, "");

    console.log(`📤 Uploading ${file}...`);
    const url = await uploadToCloudinary(filepath, slug);

    if (url) {
      console.log(`   ✅ Uploaded: ${url}\n`);
    } else {
      console.log(`   ❌ Failed to upload\n`);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--upload")) {
    await uploadLocalImages();
  } else {
    await scrapeAndDownloadImages();
  }
}

main().catch(console.error);
