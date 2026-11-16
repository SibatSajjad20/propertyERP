"use client";

import * as React from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PASSPORT_ASPECT = 35 / 45;

async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Could not load image")));
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not crop photo");
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );
  if (!blob) throw new Error("Could not crop photo");
  return blob;
}

export function PhotoCropDialog({
  open,
  imageSrc,
  onOpenChange,
  onCropped,
}: {
  open: boolean;
  imageSrc: string | null;
  onOpenChange: (open: boolean) => void;
  onCropped: (file: File) => void;
}) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [area, setArea] = React.useState<Area | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function handleApply() {
    if (!imageSrc || !area) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(imageSrc, area);
      onCropped(new File([blob], "passport-photo.jpg", { type: "image/jpeg" }));
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[16px]">
        <DialogHeader>
          <DialogTitle>Crop passport photo</DialogTitle>
        </DialogHeader>
        <div className="relative h-72 overflow-hidden rounded-[8px] bg-subtle">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={PASSPORT_ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_cropped, croppedPixels) => setArea(croppedPixels)}
            />
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-[13px] text-ink-muted">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-9 flex-1"
          />
        </label>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleApply}
            disabled={busy || !area}
          >
            {busy ? "Cropping…" : "Use photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
