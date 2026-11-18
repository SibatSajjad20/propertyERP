export const CLIENT_DOCUMENTS_BUCKET = "client-documents";
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const SIGNED_READ_SECONDS = 5 * 60;

export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;

export const ALLOWED_DOCUMENT_MIMES = [
  ...ALLOWED_IMAGE_MIMES,
  "application/pdf",
] as const;

export const CLIENT_REQUIRED_DOC_TYPES = ["PHOTO", "CNIC_FRONT", "CNIC_BACK"] as const;
export const KIN_REQUIRED_DOC_TYPES = ["KIN_PHOTO", "CNIC_FRONT", "CNIC_BACK"] as const;

export const CLIENT_ALL_DOC_TYPES = [
  "PHOTO",
  "LIVE_PHOTO",
  "THUMB_IMPRESSION",
  "CNIC_FRONT",
  "CNIC_BACK",
] as const;

export const KIN_ALL_DOC_TYPES = [
  "KIN_PHOTO",
  "KIN_LIVE_PHOTO",
  "KIN_THUMB_IMPRESSION",
  "CNIC_FRONT",
  "CNIC_BACK",
] as const;

export const DOC_TYPE_LABELS = {
  PHOTO: "Passport photo",
  KIN_PHOTO: "Passport photo",
  LIVE_PHOTO: "Live camera photo",
  KIN_LIVE_PHOTO: "Live camera photo",
  THUMB_IMPRESSION: "Thumb impression",
  KIN_THUMB_IMPRESSION: "Thumb impression",
  CNIC_FRONT: "CNIC front",
  CNIC_BACK: "CNIC back",
} as const;

export function isPassportPhotoType(docType: string): boolean {
  return docType === "PHOTO" || docType === "KIN_PHOTO";
}

export function isLivePhotoType(docType: string): boolean {
  return docType === "LIVE_PHOTO" || docType === "KIN_LIVE_PHOTO";
}

export function isThumbImpressionType(docType: string): boolean {
  return docType === "THUMB_IMPRESSION" || docType === "KIN_THUMB_IMPRESSION";
}

export function isImageOnlyDocType(docType: string): boolean {
  return (
    isPassportPhotoType(docType) ||
    isLivePhotoType(docType) ||
    isThumbImpressionType(docType)
  );
}

export function isOptionalDocType(docType: string): boolean {
  return isLivePhotoType(docType) || isThumbImpressionType(docType);
}

export function thumbnailStoragePath(storagePath: string) {
  const dot = storagePath.lastIndexOf(".");
  if (dot === -1) return `${storagePath}-thumb.jpg`;
  return `${storagePath.slice(0, dot)}-thumb.jpg`;
}
