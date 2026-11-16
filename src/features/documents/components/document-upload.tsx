"use client";

import * as React from "react";
import imageCompression from "browser-image-compression";
import { Camera, FileText, Trash, UploadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { DocumentType } from "@/db/schema/enums";
import { clearCurrentDocument } from "../actions";
import { DOC_TYPE_LABELS, MAX_DOCUMENT_BYTES, isPassportPhotoType } from "../constants";
import { PhotoCropDialog } from "./photo-crop-dialog";

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
  const [dragOver, setDragOver] = React.useState(false);
  const hasFile = Boolean(existing?.id || existing?.pendingFile);
  const shownPreview = existing?.previewUrl ?? existing?.fullUrl ?? null;

  const label =
    ownerType === "KIN"
      ? `Nominee ${DOC_TYPE_LABELS[docType]}`
      : DOC_TYPE_LABELS[docType];
  const accept = isPassportPhotoType(docType)
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
        {label} <span className="text-sold">*</span>
      </p>
      <div
        className={cn(
          "rounded-[12px] border border-dashed border-line bg-surface p-3",
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
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => inputRef.current?.click()}
                >
                  Replace
                </Button>
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
                onClick={() => cameraRef.current?.click()}
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
    </div>
  );
}
