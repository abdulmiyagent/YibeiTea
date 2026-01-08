/**
 * Cloudinary Connection Test Script
 * Run with: npx tsx scripts/test-cloudinary.ts
 */

import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Load .env.local file (Next.js convention)
config({ path: path.resolve(process.cwd(), ".env.local") });

console.log("=".repeat(60));
console.log("CLOUDINARY CONNECTION TEST");
console.log("=".repeat(60));

// Show configuration (masked)
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("\n1. Environment Variables:");
console.log(`   CLOUDINARY_CLOUD_NAME: ${cloudName || "NOT SET"}`);
console.log(`   CLOUDINARY_API_KEY: ${apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : "NOT SET"}`);
console.log(`   CLOUDINARY_API_SECRET: ${apiSecret ? `${apiSecret.slice(0, 4)}...${apiSecret.slice(-4)}` : "NOT SET"}`);

if (!cloudName || !apiKey || !apiSecret) {
  console.error("\n❌ Missing Cloudinary credentials. Please check your .env file.");
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

async function testConnection() {
  console.log("\n2. Testing API Connection...");

  try {
    // Simple API test - ping/usage
    const result = await cloudinary.api.ping();
    console.log("   ✅ API connection successful!");
    console.log("   Response:", result);
    return true;
  } catch (error: unknown) {
    const err = error as { message?: string; http_code?: number; error?: { message?: string } };
    console.error("   ❌ API connection failed!");
    console.error("   Error:", err.message || err.error?.message);
    console.error("   HTTP Code:", err.http_code);

    if (err.http_code === 401) {
      console.log("\n   💡 Possible causes:");
      console.log("      - API key does not match the cloud name");
      console.log("      - API key was regenerated in Cloudinary dashboard");
      console.log("      - API secret is incorrect");
      console.log("\n   🔧 How to fix:");
      console.log("      1. Go to https://cloudinary.com/console");
      console.log("      2. Check your cloud name in the dashboard header");
      console.log("      3. Go to Settings > API Keys");
      console.log("      4. Verify or regenerate your API credentials");
      console.log("      5. Update .env with the correct values");
    }
    return false;
  }
}

async function testUpload() {
  console.log("\n3. Testing Image Upload...");

  const testImagePath = "C:/Users/azizg/OneDrive/Desktop/good image.png";

  if (!fs.existsSync(testImagePath)) {
    console.log(`   ⚠️ Test image not found at: ${testImagePath}`);
    return false;
  }

  const buffer = fs.readFileSync(testImagePath);
  console.log(`   Image size: ${buffer.length} bytes`);

  try {
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
      format: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "yibeitea/test",
          public_id: `diagnostic-test-${Date.now()}`,
          resource_type: "image",
          format: "png",
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          });
          else reject(new Error("No result"));
        }
      );
      uploadStream.end(buffer);
    });

    console.log("   ✅ Upload successful!");
    console.log(`   URL: ${result.secure_url}`);
    console.log(`   Dimensions: ${result.width}x${result.height}`);
    console.log(`   Format: ${result.format}`);

    // Clean up
    await cloudinary.uploader.destroy(result.public_id);
    console.log("   🧹 Test image cleaned up");

    return true;
  } catch (error: unknown) {
    const err = error as { message?: string; http_code?: number };
    console.error("   ❌ Upload failed!");
    console.error("   Error:", err.message);
    return false;
  }
}

async function testBackgroundRemoval() {
  console.log("\n4. Testing Background Removal...");

  const testImagePath = "C:/Users/azizg/OneDrive/Desktop/good image.png";

  if (!fs.existsSync(testImagePath)) {
    console.log("   ⚠️ Test image not found");
    return false;
  }

  const buffer = fs.readFileSync(testImagePath);

  try {
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "yibeitea/test",
          public_id: `bg-removal-test-${Date.now()}`,
          resource_type: "image",
          format: "png",
          background_removal: "cloudinary_ai",
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
          else reject(new Error("No result"));
        }
      );
      uploadStream.end(buffer);
    });

    console.log("   ✅ Background removal successful!");
    console.log(`   URL: ${result.secure_url}`);

    // Clean up
    await cloudinary.uploader.destroy(result.public_id);
    console.log("   🧹 Test image cleaned up");

    return true;
  } catch (error: unknown) {
    const err = error as { message?: string; http_code?: number; error?: { message?: string } };
    console.error("   ❌ Background removal failed!");
    console.error("   Error:", err.message || err.error?.message);

    if (err.message?.includes("Remote server error") || err.message?.includes("background_removal")) {
      console.log("\n   💡 Background removal may not be enabled on your plan");
      console.log("      or the Cloudinary AI add-on is not activated.");
    }

    return false;
  }
}

async function main() {
  const connectionOk = await testConnection();

  if (connectionOk) {
    await testUpload();
    await testBackgroundRemoval();
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST COMPLETE");
  console.log("=".repeat(60));
}

main().catch(console.error);
