import {
  CLIENT_REQUIRED_DOC_TYPES,
  DOC_TYPE_LABELS,
  KIN_REQUIRED_DOC_TYPES,
} from "./constants";
import type { DocumentType } from "@/db/schema/enums";

export type DocumentPresence = {
  ownerType: "CLIENT" | "KIN";
  docType: DocumentType;
  replacedAt?: Date | string | null;
};

export function currentDocuments(docs: DocumentPresence[]): DocumentPresence[] {
  return docs.filter((doc) => !doc.replacedAt);
}

export function missingClientDocTypes(docs: DocumentPresence[]): DocumentType[] {
  const current = currentDocuments(docs);
  return CLIENT_REQUIRED_DOC_TYPES.filter(
    (type) => !current.some((doc) => doc.ownerType === "CLIENT" && doc.docType === type),
  );
}

export function missingKinDocTypes(docs: DocumentPresence[]): DocumentType[] {
  const current = currentDocuments(docs);
  return KIN_REQUIRED_DOC_TYPES.filter(
    (type) => !current.some((doc) => doc.ownerType === "KIN" && doc.docType === type),
  );
}

export function requiredDocumentErrorMessage(docs: DocumentPresence[]): string | null {
  const clientMissing = missingClientDocTypes(docs).map((type) => DOC_TYPE_LABELS[type]);
  const kinMissing = missingKinDocTypes(docs).map(
    (type) => `Nominee ${DOC_TYPE_LABELS[type]}`,
  );
  const missing = [...clientMissing, ...kinMissing];
  if (missing.length === 0) return null;
  return `Upload required documents: ${missing.join(", ")}`;
}
