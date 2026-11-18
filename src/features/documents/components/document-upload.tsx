"use client";

import * as React from "react";
import imageCompression from "browser-image-compression";
import {
  Camera,
  Clipboard,
  FileText,
  Fingerprint,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { DocumentType } from "@/db/schema/enums";
import { clearCurrentDocument } from "../actions";
import {
  DOC_TYPE_LABELS,
  MAX_DOCUMENT_BYTES,
  isImageOnlyDocType,
  isLivePhotoType,
  isOptionalDocType,
  isPassportPhotoType,
  isThumbImpressionType,
} from "../constants";
import { PhotoCropDialog } from "./photo-crop-dialog";
import { CameraCaptureDialog } from "./camera-capture-dialog";

export type ExistingDocument = {
  id: string;
  mimeType: string;
  usedExisting?: boolean;
  previewUrl?: string | null;
  fullUrl?: string | null;
  pendingFile?: File;
  pendingThumb?: File;
};

type OwnerType = "CLIENT" | "KIN";

export function DocumentUpload({
  ownerType,
  docType,
  existing,
  error,
  onUploaded,
  onCleared,
}: {
  ownerType: OwnerType;
  docType: DocumentType;
  clientId?: string | null;
  kinId?: string | null;
  existing: ExistingDocument | null;
  error?: string;
  onUploaded: (doc: ExistingDocument) => void;
  onCleared: () => void;
  ensureOwner?: () => Promise<{ clientId: string; kinId: string | null }>;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [cropSrc, setCropSrc] = React.useState<string | null>(null);
  const [liveCamOpen, setLiveCamOpen] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const hasFile = Boolean(existing?.id || existing?.pendingFile);
  const shownPreview = existing?.previewUrl ?? existing?.fullUrl ?? null;

  const isLivePhoto = isLivePhotoType(docType);
  const isThumbImpression = isThumbImpressionType(docType);
  const isOptional = isOptionalDocType(docType);

  const label =
    ownerType === "KIN"
      ? `Nominee ${DOC_TYPE_LABELS[docType]}`
      : DOC_TYPE_LABELS[docType];
  const accept = isImageOnlyDocType(docType)
    ? "image/jpeg,image/png,image/webp"
    : "image/jpeg,image/png,image/webp,application/pdf";

  async function prepareFile(file: File): Promise<File> {
    if (file.size > MAX_DOCUMENT_BYTES && !file.type.startsWith("image/")) {
      throw new Error("File must be 5 MB or smaller");
    }
    if (!file.type.startsWith("image/")) return file;
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 1600,
      initialQuality: 0.8,
      fileType: "image/jpeg",
      useWebWorker: true,
    });
    return new File([compressed], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  async function makeThumb(file: File): Promise<File | undefined> {
    if (!file.type.startsWith("image/")) return undefined;
    const thumb = await imageCompression(file, {
      maxWidthOrHeight: 300,
      initialQuality: 0.7,
      fileType: "image/jpeg",
      useWebWorker: true,
    });
    return new File([thumb], "thumb.jpg", { type: "image/jpeg" });
  }

  async function queueFile(file: File) {
    setLocalError(null);
    setProgress(12);
    try {
      const prepared = await prepareFile(file);
      setProgress(55);
      const thumb = await makeThumb(prepared);
      setProgress(100);
      const previewUrl = URL.createObjectURL(thumb ?? prepared);
      onUploaded({
        id: `pending:${ownerType}:${docType}`,
        mimeType: prepared.type || "image/jpeg",
        pendingFile: prepared,
        pendingThumb: thumb,
        previewUrl,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not prepare file");
    } finally {
      setProgress(null);
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (isPassportPhotoType(docType)) {
      const url = URL.createObjectURL(file);
      setCropSrc(url);
      return;
    }
    void queueFile(file);
  }

  async function handlePasteClipboardButton() {
    setLocalError(null);
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.read) {
        setLocalError(
          "Click this box and press Ctrl+V to paste the scanned thumb impression, or choose a file.",
        );
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split("/")[1] || "png";
          const file = new File([blob], `thumb-impression-${Date.now()}.${ext}`, {
            type: imageType,
            lastModified: Date.now(),
          });
          await queueFile(file);
          return;
        }
      }
      setLocalError(
        "No image found in clipboard. Capture fingerprint on your scanner and copy it first.",
      );
    } catch {
      setLocalError(
        "Clipboard permission denied. Click this box and press Ctrl+V, or choose a file.",
      );
    }
  }

  function handlePasteEvent(e: React.ClipboardEvent) {
    if (!isThumbImpression) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const named = new File(
            [file],
            file.name || `thumb-impression-${Date.now()}.png`,
            { type: file.type, lastModified: Date.now() },
          );
          void queueFile(named);
        }
        return;
      }
    }
  }

  async function handleRemove() {
    if (existing?.id && !existing.id.startsWith("pending:")) {
      try {
        await clearCurrentDocument({ documentId: existing.id });
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Could not remove file");
        return;
      }
    }
    if (existing?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(existing.previewUrl);
    }
    onCleared();
  }

  const displayError = localError || error;
  const isPdf = existing?.mimeType === "application/pdf";

  return (
    <div className="space-y-1.5" data-doc-type={docType} data-owner-type={ownerType}>
      <p className="text-[12px] font-medium text-ink">
        {label}{" "}
        {isOptional ? (
          <span className="font-normal text-ink-muted">(Optional)</span>
        ) : (
          <span className="text-sold">*</span>
        )}
      </p>
      <div
        tabIndex={isThumbImpression ? 0 : undefined}
        onPaste={handlePasteEvent}
        className={cn(
          "rounded-[12px] border border-dashed border-line bg-surface p-3",
          isThumbImpression &&
            "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
          dragOver && "border-primary bg-primary-soft",
          displayError && "border-sold",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {hasFile ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="size-16 overflow-hidden rounded-[8px] border border-line bg-subtle"
              onClick={() =>
                shownPreview && window.open(shownPreview, "_blank", "noopener")
              }
            >
              {shownPreview && !isPdf ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownPreview} alt={label} className="size-full object-cover" />
              ) : (
                <FileText weight="light" className="mx-auto mt-4 size-6 text-primary" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-ink">
                {existing?.pendingFile ? "Ready to upload" : "Uploaded"}
              </p>
              {progress != null ? (
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-subtle">
                  <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {existing?.usedExisting ? (
                  <Button type="button" size="sm" variant="primary" disabled>
                    Use existing
                  </Button>
                ) : null}
                {isLivePhoto ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setLiveCamOpen(true)}
                  >
                    <Camera weight="light" className="mr-1 size-3.5" />
                    Retake
                  </Button>
                ) : isThumbImpression ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void handlePasteClipboardButton()}
                  >
                    <Clipboard weight="light" className="mr-1 size-3.5" />
                    Paste new
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => inputRef.current?.click()}
                  >
                    Replace
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void handleRemove()}
                >
                  <Trash weight="light" className="size-4" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : isLivePhoto ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <Camera weight="light" className="size-6 text-primary" />
            <p className="text-[12px] text-ink-muted">
              Capture live photo directly from camera
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => setLiveCamOpen(true)}
              >
                <Camera weight="light" className="mr-1 size-4" />
                Open Camera
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
              >
                Upload
              </Button>
            </div>
            {progress != null ? (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            ) : null}
          </div>
        ) : isThumbImpression ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <Fingerprint weight="light" className="size-6 text-primary" />
            <p className="text-[12px] text-ink-muted">
              Scan on thumb device &amp; press{" "}
              <kbd className="rounded border border-line px-1 text-[10px]">Ctrl+V</kbd> or
              paste
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => void handlePasteClipboardButton()}
              >
                <Clipboard weight="light" className="mr-1 size-4" />
                Paste Fingerprint
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
              >
                Upload
              </Button>
            </div>
            {progress != null ? (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <UploadSimple weight="light" className="size-6 text-primary" />
            <p className="text-[12px] text-ink-muted">Drag & drop or click to upload</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
              >
                Choose file
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setLiveCamOpen(true)}
              >
                <Camera weight="light" className="size-4" />
                Camera
              </Button>
            </div>
            {progress != null ? (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            ) : null}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          className="sr-only"
          accept="image/*"
          capture={isPassportPhotoType(docType) ? "user" : "environment"}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {displayError ? (
        <p className="text-[11px] font-medium text-sold">{displayError}</p>
      ) : null}
      <PhotoCropDialog
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        onOpenChange={(open) => {
          if (!open) {
            if (cropSrc) URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }
        }}
        onCropped={(file) => {
          if (cropSrc) URL.revokeObjectURL(cropSrc);
          setCropSrc(null);
          void queueFile(file);
        }}
      />
      <CameraCaptureDialog
        open={liveCamOpen}
        title={label}
        onOpenChange={setLiveCamOpen}
        onCaptured={(file) => {
          if (isPassportPhotoType(docType)) {
            const url = URL.createObjectURL(file);
            setCropSrc(url);
            return;
          }
          void queueFile(file);
        }}
      />
    </div>
  );
}
