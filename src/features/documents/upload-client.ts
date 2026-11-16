"use client";

import { finalizeUploads, prepareUploads } from "./actions";
import type { ExistingDocument } from "./components/document-upload";
import type { ClientInput, NextOfKinInput } from "@/features/sales/schema";
import type { DocumentType } from "@/db/schema/enums";

export type PendingUpload = {
  ownerType: "CLIENT" | "KIN";
  docType: DocumentType;
  file: File;
  thumbFile?: File;
};

export function collectPending(docs: {
  client: Partial<Record<DocumentType, ExistingDocument | null>>;
  kin: Partial<Record<DocumentType, ExistingDocument | null>>;
}): PendingUpload[] {
  const pending: PendingUpload[] = [];
  for (const [docType, slot] of Object.entries(docs.client) as [
    DocumentType,
    ExistingDocument | null,
  ][]) {
    if (slot?.pendingFile) {
      pending.push({
        ownerType: "CLIENT",
        docType,
        file: slot.pendingFile,
        thumbFile: slot.pendingThumb,
      });
    }
  }
  for (const [docType, slot] of Object.entries(docs.kin) as [
    DocumentType,
    ExistingDocument | null,
  ][]) {
    if (slot?.pendingFile) {
      pending.push({
        ownerType: "KIN",
        docType,
        file: slot.pendingFile,
        thumbFile: slot.pendingThumb,
      });
    }
  }
  return pending;
}

export function isDocReady(doc?: ExistingDocument | null) {
  return Boolean(doc?.pendingFile || (doc?.id && !doc.id.startsWith("pending:")));
}

export async function flushPendingUploads(opts: {
  pending: PendingUpload[];
  client?: ClientInput;
  nextOfKin?: NextOfKinInput;
  clientId?: string | null;
  kinId?: string | null;
}) {
  if (opts.pending.length === 0) {
    return {
      clientId: opts.clientId ?? null,
      kinId: opts.kinId ?? null,
      documents: [] as {
        id: string;
        ownerType: "CLIENT" | "KIN";
        docType: DocumentType;
        mimeType: string;
      }[],
    };
  }

  const prepared = await prepareUploads({
    client: opts.client,
    nextOfKin: opts.nextOfKin,
    clientId: opts.clientId ?? undefined,
    kinId: opts.kinId ?? undefined,
    docs: opts.pending.map((item) => ({
      ownerType: item.ownerType,
      docType: item.docType,
      mimeType: item.file.type || "image/jpeg",
      fileExt: (item.file.name.split(".").pop() || "jpg").slice(0, 8),
      sizeBytes: item.file.size,
      hasThumbnail: Boolean(item.thumbFile),
    })),
  });

  await Promise.all(
    prepared.uploads.map(async (signed) => {
      const item = opts.pending.find(
        (p) => p.ownerType === signed.ownerType && p.docType === signed.docType,
      );
      if (!item) return;
      const put = await fetch(signed.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": signed.mimeType },
        body: item.file,
      });
      if (!put.ok) throw new Error("Upload failed. Try again.");
      if (signed.thumbnail && item.thumbFile) {
        const thumbPut = await fetch(signed.thumbnail.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: item.thumbFile,
        });
        if (!thumbPut.ok) throw new Error("Thumbnail upload failed. Try again.");
      }
    }),
  );

  const saved = await finalizeUploads({
    clientId: prepared.clientId,
    kinId: prepared.kinId ?? undefined,
    docs: prepared.uploads.map((signed) => {
      const item = opts.pending.find(
        (p) => p.ownerType === signed.ownerType && p.docType === signed.docType,
      );
      return {
        ownerType: signed.ownerType,
        docType: signed.docType,
        storagePath: signed.path,
        mimeType: signed.mimeType,
        sizeBytes: item?.file.size ?? 1,
        thumbnailPath: signed.thumbnail?.path,
      };
    }),
  });

  return saved;
}
