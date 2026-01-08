import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadOptions {
  folder: string;
  removeBackground?: boolean;
}

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Upload an image to Cloudinary with optional background removal
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  options: UploadOptions
): Promise<UploadResult & { backgroundRemoved?: boolean }> {
  const { folder, removeBackground = false } = options;

  const doUpload = (withBackgroundRemoval: boolean): Promise<UploadResult & { backgroundRemoved?: boolean }> => {
    return new Promise((resolve, reject) => {
      const uploadOptions: Record<string, unknown> = {
        folder: `yibeitea/${folder}`,
        public_id: filename.replace(/\.[^.]+$/, ""), // Remove extension
        resource_type: "image",
        format: "png", // PNG for transparency support
      };

      // Add background removal transformation if requested
      if (withBackgroundRemoval) {
        uploadOptions.background_removal = "cloudinary_ai";
      }

      // Upload using upload_stream for buffer data
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(new Error(`Upload failed: ${error.message}`));
            return;
          }

          if (!result) {
            reject(new Error("Upload failed: No result returned"));
            return;
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            backgroundRemoved: withBackgroundRemoval,
          });
        }
      );

      uploadStream.end(buffer);
    });
  };

  // Try with background removal first if requested
  if (removeBackground) {
    try {
      return await doUpload(true);
    } catch (error) {
      console.warn("Background removal failed, retrying without:", error);
      // Retry without background removal
      return await doUpload(false);
    }
  }

  return doUpload(false);
}

/**
 * Get a Cloudinary URL with transformations
 */
export function getImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    removeBackground?: boolean;
  }
): string {
  const transformations: Record<string, unknown>[] = [];

  if (options?.removeBackground) {
    transformations.push({ effect: "background_removal" });
  }

  if (options?.width || options?.height) {
    transformations.push({
      width: options.width,
      height: options.height,
      crop: options.crop || "fill",
    });
  }

  if (options?.quality) {
    transformations.push({ quality: options.quality });
  }

  return cloudinary.url(publicId, {
    transformation: transformations,
    secure: true,
  });
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export default cloudinary;
