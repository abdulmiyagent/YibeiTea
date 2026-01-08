import { removeBackground as removeBackgroundLib } from "@imgly/background-removal";

/**
 * Remove background from an image file using AI (runs in browser via WebAssembly)
 * No API keys required - completely free and private
 */
export async function removeBackground(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    const blob = await removeBackgroundLib(imageFile, {
      model: "medium", // Balance between quality and speed
      progress: (key, current, total) => {
        if (onProgress && total > 0) {
          const progress = Math.round((current / total) * 100);
          onProgress(progress);
        }
      },
    });

    return blob;
  } catch (error) {
    console.error("Background removal failed:", error);
    throw new Error("Achtergrond verwijderen mislukt. Probeer opnieuw.");
  }
}

/**
 * Convert a Blob to a File object
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename.replace(/\.[^.]+$/, ".png"), {
    type: "image/png",
  });
}
