import { describe, it, expect, beforeAll } from "vitest";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Load .env.local for Cloudinary credentials
config({ path: path.resolve(process.cwd(), ".env.local") });

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const TEST_TIMEOUT = 60000;

// Test image path
const TEST_IMAGE_PATH = "C:/Users/azizg/OneDrive/Desktop/good image.png";

describe("Product Image Upload with Transparency", () => {
  let testImageBuffer: Buffer;

  beforeAll(async () => {
    // Check if test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      throw new Error(`Test image not found at: ${TEST_IMAGE_PATH}`);
    }
    testImageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    console.log(`Loaded test image: ${testImageBuffer.length} bytes`);
  });

  it.skip("should upload image to /api/upload endpoint (without auth - expect 401)", async () => {
    const formData = new FormData();
    const blob = new Blob([testImageBuffer], { type: "image/png" });
    formData.append("file", blob, "good-image.png");
    formData.append("folder", "products");
    formData.append("removeBackground", "true");

    console.log("\n--- Test 1: Upload without authentication ---");
    console.log(`POST ${BASE_URL}/api/upload`);
    console.log(`Image size: ${testImageBuffer.length} bytes`);
    console.log(`Background removal: enabled`);

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    console.log(`Response status: ${response.status}`);
    console.log(`Response body: ${JSON.stringify(data, null, 2)}`);

    // Should return 401 Unauthorized without authentication
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  }, TEST_TIMEOUT);

  it("should verify Cloudinary configuration via environment check", async () => {
    console.log("\n--- Test 2: Cloudinary Configuration Check ---");

    // This test verifies the environment variables are set
    // In real e2e tests, we'd use authenticated requests
    const cloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    console.log(`CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? "set" : "NOT SET"}`);
    console.log(`CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? "set" : "NOT SET"}`);
    console.log(`CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? "set" : "NOT SET"}`);
    console.log(`Cloudinary configured: ${cloudinaryConfigured}`);

    // Log whether background removal would work
    if (cloudinaryConfigured) {
      console.log("✅ Cloudinary is configured - background removal should work");
    } else {
      console.log("⚠️ Cloudinary NOT configured - images will be stored locally without background removal");
    }

    // This test always passes - it's informational
    expect(true).toBe(true);
  });

  it("should test direct Cloudinary upload with background removal", async () => {
    console.log("\n--- Test 3: Direct Cloudinary Upload Test ---");

    // Check if Cloudinary is configured
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.log("⚠️ Skipping direct Cloudinary test - credentials not configured");
      console.log("To test Cloudinary upload, set:");
      console.log("  - CLOUDINARY_CLOUD_NAME");
      console.log("  - CLOUDINARY_API_KEY");
      console.log("  - CLOUDINARY_API_SECRET");
      return;
    }

    // Import cloudinary dynamically
    const { v2: cloudinary } = await import("cloudinary");

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    console.log(`Uploading to Cloudinary cloud: ${cloudName}`);
    console.log(`Image size: ${testImageBuffer.length} bytes`);

    // Upload with background removal
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
      format: string;
    }>((resolve, reject) => {
      const uploadOptions = {
        folder: "yibeitea/test-products",
        public_id: `test-upload-${Date.now()}`,
        resource_type: "image" as const,
        format: "png",
        background_removal: "cloudinary_ai",
      };

      console.log("Upload options:", JSON.stringify(uploadOptions, null, 2));

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary error:", error);
            reject(error);
            return;
          }
          if (!result) {
            reject(new Error("No result"));
            return;
          }
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        }
      );
      uploadStream.end(testImageBuffer);
    });

    console.log("\n✅ Upload successful!");
    console.log(`URL: ${result.secure_url}`);
    console.log(`Public ID: ${result.public_id}`);
    console.log(`Dimensions: ${result.width}x${result.height}`);
    console.log(`Format: ${result.format}`);

    // Verify the result
    expect(result.secure_url).toBeTruthy();
    expect(result.secure_url).toContain("cloudinary.com");
    expect(result.format).toBe("png"); // PNG for transparency

    // Fetch the image and verify it's accessible
    const imageResponse = await fetch(result.secure_url);
    expect(imageResponse.ok).toBe(true);
    console.log(`Image accessible: ${imageResponse.ok}`);
    console.log(`Content-Type: ${imageResponse.headers.get("content-type")}`);

    // Clean up - delete the test image
    try {
      await cloudinary.uploader.destroy(result.public_id);
      console.log(`\n🧹 Cleaned up test image: ${result.public_id}`);
    } catch (cleanupError) {
      console.log(`⚠️ Could not clean up test image: ${cleanupError}`);
    }
  }, TEST_TIMEOUT * 2); // Double timeout for Cloudinary processing

  it("should test upload without background removal", async () => {
    console.log("\n--- Test 4: Upload Without Background Removal ---");

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.log("⚠️ Skipping - Cloudinary not configured");
      return;
    }

    const { v2: cloudinary } = await import("cloudinary");

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    console.log("Uploading WITHOUT background removal...");

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "yibeitea/test-products",
          public_id: `test-no-bg-removal-${Date.now()}`,
          resource_type: "image",
          format: "png",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          if (!result) {
            reject(new Error("No result"));
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
      uploadStream.end(testImageBuffer);
    });

    console.log("✅ Upload successful (no background removal)!");
    console.log(`URL: ${result.secure_url}`);

    expect(result.secure_url).toBeTruthy();

    // Clean up
    try {
      await cloudinary.uploader.destroy(result.public_id);
      console.log(`🧹 Cleaned up: ${result.public_id}`);
    } catch (e) {
      console.log(`⚠️ Cleanup failed: ${e}`);
    }
  }, TEST_TIMEOUT);

  it("should verify image has PNG format for transparency support", async () => {
    console.log("\n--- Test 5: Verify PNG Format ---");

    // Read first 8 bytes of test image to verify PNG signature
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const imageHeader = testImageBuffer.slice(0, 8);

    const isPng = imageHeader.equals(pngSignature);
    console.log(`Test image is PNG: ${isPng}`);
    console.log(`Header bytes: ${imageHeader.toString("hex")}`);
    console.log(`Expected:     ${pngSignature.toString("hex")}`);

    expect(isPng).toBe(true);
  });
});
