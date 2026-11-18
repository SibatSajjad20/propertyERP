import { z } from "zod";
import { documentOwnerTypes, documentTypes } from "@/db/schema/enums";
import type { DocumentType } from "@/db/schema/enums";
import { clientSchema, requiredNextOfKinSchema } from "@/features/sales/schema";
import {
  ALLOWED_DOCUMENT_MIMES,
  ALLOWED_IMAGE_MIMES,
  isImageOnlyDocType,
  isLivePhotoType,
  isPassportPhotoType,
  isThumbImpressionType,
} from "./constants";

export const documentOwnerTypeSchema = z.enum(documentOwnerTypes);
export const documentTypeSchema = z.enum(documentTypes);

export const createUploadUrlSchema = z.object({
  ownerType: documentOwnerTypeSchema,
  clientId: z.string().uuid(),
  kinId: z.string().uuid().optional(),
  docType: documentTypeSchema,
  mimeType: z.string().trim().min(1),
  fileExt: z.string().trim().min(1).max(8),
});

export const completeUploadSchema = z.object({
  ownerType: documentOwnerTypeSchema,
  clientId: z.string().uuid(),
  kinId: z.string().uuid().optional(),
  docType: documentTypeSchema,
  storagePath: z.string().trim().min(1).max(500),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.number().int().positive(),
});

export const documentIdSchema = z.object({
  documentId: z.string().uuid(),
});

export const listDocumentsSchema = z.object({
  clientId: z.string().uuid(),
});

export const clearDocumentSchema = z.object({
  documentId: z.string().uuid(),
});

export const prepareUploadsSchema = z.object({
  client: clientSchema.optional(),
  nextOfKin: requiredNextOfKinSchema.optional(),
  clientId: z.string().uuid().optional(),
  kinId: z.string().uuid().optional(),
  docs: z
    .array(
      z.object({
        ownerType: documentOwnerTypeSchema,
        docType: documentTypeSchema,
        mimeType: z.string().trim().min(1),
        fileExt: z.string().trim().min(1).max(8),
        sizeBytes: z.number().int().positive(),
        hasThumbnail: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(12),
});

export const finalizeUploadsSchema = z.object({
  clientId: z.string().uuid(),
  kinId: z.string().uuid().optional(),
  docs: z
    .array(
      z.object({
        ownerType: documentOwnerTypeSchema,
        docType: documentTypeSchema,
        storagePath: z.string().trim().min(1).max(500),
        mimeType: z.string().trim().min(1),
        sizeBytes: z.number().int().positive(),
        thumbnailPath: z.string().trim().min(1).max(500).optional(),
      }),
    )
    .min(1)
    .max(12),
});

export const documentIdsSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1).max(40),
});

export function assertAllowedMime(docType: DocumentType, mime: string) {
  if (isImageOnlyDocType(docType)) {
    return (ALLOWED_IMAGE_MIMES as readonly string[]).includes(mime);
  }
  return (ALLOWED_DOCUMENT_MIMES as readonly string[]).includes(mime);
}

export function photoMimeError(docType: DocumentType) {
  if (isPassportPhotoType(docType)) {
    return "Passport photo must be a JPEG, PNG, or WebP image";
  }
  if (isLivePhotoType(docType)) {
    return "Live camera photo must be a JPEG, PNG, or WebP image";
  }
  if (isThumbImpressionType(docType)) {
    return "Thumb impression must be a JPEG, PNG, or WebP image";
  }
  return "CNIC must be a JPEG, PNG, WebP, or PDF";
}

export function photoOwnerError(
  docType: DocumentType,
  ownerType: "CLIENT" | "KIN",
): string | null {
  if (
    (docType === "PHOTO" || docType === "LIVE_PHOTO" || docType === "THUMB_IMPRESSION") &&
    ownerType !== "CLIENT"
  ) {
    return "Client proof document is only stored on the client";
  }
  if (
    (docType === "KIN_PHOTO" ||
      docType === "KIN_LIVE_PHOTO" ||
      docType === "KIN_THUMB_IMPRESSION") &&
    ownerType !== "KIN"
  ) {
    return "Next of kin proof document is only stored on the nominee";
  }
  return null;
}
