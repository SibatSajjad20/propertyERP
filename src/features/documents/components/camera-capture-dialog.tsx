"use client";

import * as React from "react";
import { ArrowsClockwise, Camera, Check, VideoCameraSlash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CameraCaptureDialogProps {
  open: boolean;
  title?: string;
  onOpenChange: (open: boolean) => void;
  onCaptured: (file: File) => void;
}

export function CameraCaptureDialog({
  open,
  title = "Live Camera Photo",
  onOpenChange,
  onCaptured,
}: CameraCaptureDialogProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = React.useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = React.useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = React.useState<Blob | null>(null);

  const stopStream = React.useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!open || capturedDataUrl) return;
    let cancelled = false;
    stopStream();

    async function init() {
      try {
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            "Camera access is not supported in this browser or requires HTTPS / localhost.",
          );
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (!cancelled) {
          setCameraError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Could not access the camera. Please check camera permissions.";
        setCameraError(msg);
        setIsLoading(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, facingMode, capturedDataUrl, stopStream]);

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      stopStream();
      setCapturedDataUrl(null);
      setCapturedBlob(null);
      setCameraError(null);
      setIsLoading(false);
    } else {
      setCameraError(null);
      setIsLoading(true);
    }
    onOpenChange(nextOpen);
  }

  function handleSnap() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedDataUrl(dataUrl);
    canvas.toBlob(
      (blob) => {
        if (blob) setCapturedBlob(blob);
      },
      "image/jpeg",
      0.9,
    );
    stopStream();
  }

  function handleRetake() {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setCameraError(null);
    setIsLoading(true);
  }

  function handleConfirm() {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `live-photo-${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    stopStream();
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    onCaptured(file);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera weight="light" className="size-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Position the face inside the frame and capture a live photograph on the spot.
          </DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-[12px] border border-line bg-[#0F172A]">
          <canvas ref={canvasRef} className="hidden" />
          {capturedDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedDataUrl}
              alt="Captured preview"
              className="aspect-[4/3] w-full object-cover"
            />
          ) : cameraError ? (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 p-6 text-center text-white/80">
              <VideoCameraSlash weight="light" className="size-8 text-sold" />
              <p className="text-[13px] font-medium text-white">Camera unavailable</p>
              <p className="max-w-sm text-[12px] text-white/70">{cameraError}</p>
            </div>
          ) : (
            <div className="relative aspect-[4/3] w-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="size-full object-cover"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[12px] text-white">
                  Starting camera…
                </div>
              )}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <div className="h-[72%] w-[50%] rounded-full border-2 border-dashed border-white/45" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-2 sm:justify-between">
          {!capturedDataUrl ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setFacingMode((m) => (m === "user" ? "environment" : "user"))
                }
                disabled={isLoading || Boolean(cameraError)}
              >
                <ArrowsClockwise weight="light" className="mr-1.5 size-4" />
                Switch Camera
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSnap}
                  disabled={isLoading || Boolean(cameraError)}
                >
                  <Camera weight="bold" className="mr-1.5 size-4" />
                  Capture Photo
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button type="button" variant="secondary" size="sm" onClick={handleRetake}>
                <ArrowsClockwise weight="light" className="mr-1.5 size-4" />
                Retake
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleConfirm}>
                <Check weight="bold" className="mr-1.5 size-4" />
                Use Photo
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
