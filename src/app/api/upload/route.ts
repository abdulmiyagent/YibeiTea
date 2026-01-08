import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin role
    const userRole = session.user.role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = (formData.get("folder") as string) || "products";
    const removeBackground = formData.get("removeBackground") === "true";

    // Validate folder to prevent path traversal
    const allowedFolders = ["products", "categories", "banners", "avatars"];
    const folder = allowedFolders.includes(rawFolder) ? rawFolder : "products";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 5MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
    const extension = path.extname(originalName) || ".png";
    const baseName = path.basename(originalName, extension);
    const filename = `${baseName}-${timestamp}`;

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try Cloudinary first if configured
    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadImage(buffer, filename, {
          folder,
          removeBackground: removeBackground && folder === "products",
        });

        return NextResponse.json({
          success: true,
          imageUrl: result.url,
          publicId: result.publicId,
          width: result.width,
          height: result.height,
          provider: "cloudinary",
          backgroundRemoved: result.backgroundRemoved ?? false,
        });
      } catch (cloudinaryError) {
        console.error("Cloudinary upload failed, falling back to local:", cloudinaryError);
        // Fall through to local storage
      }
    }

    // Fallback: Local storage
    const filenameWithExt = `${filename}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "images", folder);
    await mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filenameWithExt);
    await writeFile(filepath, buffer);

    const imageUrl = `/images/${folder}/${filenameWithExt}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      filename: filenameWithExt,
      provider: "local",
      backgroundRemoved: false,
      warning: removeBackground
        ? "Background removal requires Cloudinary. Image saved without processing."
        : undefined,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
