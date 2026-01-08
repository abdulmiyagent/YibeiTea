"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  className?: string;
  disabled?: boolean;
  showBackgroundRemoval?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  folder = "products",
  className,
  disabled = false,
  showBackgroundRemoval = true,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isProductUpload = folder === "products";
  const canRemoveBackground = showBackgroundRemoval && isProductUpload;

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);
      setUploadStatus(
        canRemoveBackground && removeBackground
          ? "Achtergrond verwijderen..."
          : "Uploading..."
      );

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        if (canRemoveBackground && removeBackground) {
          formData.append("removeBackground", "true");
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        onChange(data.imageUrl);

        // Show warning if background removal was requested but not performed
        if (data.warning) {
          setError(data.warning);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
        setUploadStatus(null);
      }
    },
    [folder, onChange, removeBackground, canRemoveBackground]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    } else {
      setError("Please drop an image file");
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Background removal toggle - only for products */}
      {canRemoveBackground && !value && (
        <div className="flex items-center gap-3 rounded-lg border border-tea-200 bg-tea-50/50 p-3">
          <Sparkles className="h-4 w-4 text-tea-600" />
          <div className="flex flex-1 items-center justify-between">
            <Label
              htmlFor="remove-bg"
              className="cursor-pointer text-sm font-medium text-tea-800"
            >
              Achtergrond verwijderen
            </Label>
            <Switch
              id="remove-bg"
              checked={removeBackground}
              onCheckedChange={setRemoveBackground}
              disabled={disabled || isUploading}
            />
          </div>
        </div>
      )}

      {value ? (
        <div className="relative">
          <div
            className={cn(
              "relative aspect-square w-full max-w-[200px] overflow-hidden rounded-xl border",
              // Checkerboard pattern to show transparency
              "bg-[length:20px_20px] bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[position:0_0,0_10px,10px_-10px,-10px_0]"
            )}
          >
            <Image
              src={value}
              alt="Product image"
              fill
              className="object-contain"
              sizes="200px"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "relative flex aspect-square w-full max-w-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
            isDragging
              ? "border-tea-500 bg-tea-50"
              : "border-muted-foreground/25 hover:border-tea-400 hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onDragOver={!disabled ? handleDragOver : undefined}
          onDragLeave={!disabled ? handleDragLeave : undefined}
          onDrop={!disabled ? handleDrop : undefined}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {uploadStatus}
              </p>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Drop image here
                <br />
                or click to upload
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {value && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            Vervangen
          </Button>
        </div>
      )}
    </div>
  );
}
