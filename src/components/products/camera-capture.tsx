"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw, Check, SwitchCamera, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClear: () => void;
  capturedImage: string | null;
  translations: {
    takePhoto: string;
    retake: string;
    usePhoto: string;
    switchCamera: string;
    cameraError: string;
    cameraPermission: string;
    addYourPhoto: string;
    yourPhoto: string;
  };
}

type FacingMode = "user" | "environment";

export function CameraCapture({
  onCapture,
  onClear,
  capturedImage,
  translations,
}: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if device has multiple cameras
  const checkForMultipleCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setHasMultipleCameras(videoDevices.length > 1);
    } catch {
      setHasMultipleCameras(false);
    }
  }, []);

  // Start the camera stream
  const startCamera = useCallback(async (facing: FacingMode = facingMode) => {
    try {
      setError(null);

      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      await checkForMultipleCameras();
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError(translations.cameraPermission);
        } else {
          setError(translations.cameraError);
        }
      } else {
        setError(translations.cameraError);
      }
    }
  }, [stream, facingMode, checkForMultipleCameras, translations]);

  // Stop the camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Handle dialog open/close
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      setPreviewImage(null);
      startCamera();
    } else {
      stopCamera();
      setPreviewImage(null);
      setError(null);
    }
  }, [startCamera, stopCamera]);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL (JPEG for smaller size)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreviewImage(dataUrl);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);

  // Use the captured photo
  const usePhoto = useCallback(() => {
    if (previewImage) {
      onCapture(previewImage);
      handleOpenChange(false);
    }
  }, [previewImage, onCapture, handleOpenChange]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setPreviewImage(null);
  }, []);

  // Switch camera
  const switchCamera = useCallback(() => {
    const newFacing: FacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // If there's a captured image, show it with option to clear
  if (capturedImage) {
    return (
      <div className="relative group">
        <div className="relative aspect-square w-full max-w-[120px] rounded-xl overflow-hidden border-2 border-tea-200 shadow-sm">
          <img
            src={capturedImage}
            alt={translations.yourPhoto}
            className="h-full w-full object-cover"
          />
          {/* Overlay with remove button */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={onClear}
              className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-colors"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="text-xs text-center text-gray-500 mt-1">{translations.yourPhoto}</p>
      </div>
    );
  }

  // Show the camera button
  return (
    <>
      <button
        onClick={() => handleOpenChange(true)}
        className={cn(
          "flex flex-col items-center justify-center gap-2 p-4",
          "aspect-square w-full max-w-[120px] rounded-xl",
          "border-2 border-dashed border-gray-300",
          "bg-gradient-to-br from-gray-50 to-gray-100",
          "hover:border-tea-400 hover:from-tea-50 hover:to-tea-100",
          "transition-all duration-200",
          "group cursor-pointer"
        )}
      >
        <div className="relative">
          <Camera className="h-8 w-8 text-gray-400 group-hover:text-tea-500 transition-colors" />
          <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full">
            <ImageIcon className="h-3 w-3 text-gray-400" />
          </div>
        </div>
        <span className="text-xs text-gray-500 group-hover:text-tea-600 text-center leading-tight">
          {translations.addYourPhoto}
        </span>
      </button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden" showCloseButton={false}>
          <DialogTitle className="sr-only">{translations.takePhoto}</DialogTitle>

          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera view or preview */}
          <div className="relative aspect-[4/3] bg-black">
            {error ? (
              // Error state
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
                <Camera className="h-12 w-12 mb-4 text-gray-400" />
                <p className="text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => startCamera()}
                >
                  {translations.retake}
                </Button>
              </div>
            ) : previewImage ? (
              // Preview captured image
              <img
                src={previewImage}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              // Live camera view
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            )}

            {/* Close button */}
            <button
              onClick={() => handleOpenChange(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Switch camera button */}
            {hasMultipleCameras && !previewImage && !error && (
              <button
                onClick={switchCamera}
                className="absolute top-3 left-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                title={translations.switchCamera}
              >
                <SwitchCamera className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="p-4 bg-white">
            {previewImage ? (
              // Preview actions
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={retakePhoto}
                >
                  <RotateCcw className="h-4 w-4" />
                  {translations.retake}
                </Button>
                <Button
                  className="flex-1 gap-2 bg-tea-600 hover:bg-tea-700"
                  onClick={usePhoto}
                >
                  <Check className="h-4 w-4" />
                  {translations.usePhoto}
                </Button>
              </div>
            ) : (
              // Capture button
              <div className="flex justify-center">
                <button
                  onClick={capturePhoto}
                  disabled={!!error}
                  className={cn(
                    "w-16 h-16 rounded-full",
                    "bg-white border-4 border-tea-500",
                    "flex items-center justify-center",
                    "hover:border-tea-600 active:scale-95",
                    "transition-all duration-150",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-tea-500 hover:bg-tea-600 transition-colors" />
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
