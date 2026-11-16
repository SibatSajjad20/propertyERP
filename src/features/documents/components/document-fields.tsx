"use client";

import type { DocumentType } from "@/db/schema/enums";
import { DocumentUpload, type ExistingDocument } from "./document-upload";

export type DocSlotMap = Partial<Record<DocumentType, ExistingDocument | null>>;

export function ClientDocumentFields({
  clientId,
  docs,
  errors,
  onChange,
}: {
  clientId: string | null;
  docs: DocSlotMap;
  errors?: Partial<Record<DocumentType, string>>;
  onChange: (docType: DocumentType, doc: ExistingDocument | null) => void;
  ensureOwner?: () => Promise<{ clientId: string; kinId: string | null }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {(["PHOTO", "CNIC_FRONT", "CNIC_BACK"] as const).map((docType) => (
        <DocumentUpload
          key={docType}
          ownerType="CLIENT"
          docType={docType}
          clientId={clientId}
          existing={docs[docType] ?? null}
          error={errors?.[docType]}
          onUploaded={(doc) => onChange(docType, doc)}
          onCleared={() => onChange(docType, null)}
        />
      ))}
    </div>
  );
}

export function KinDocumentFields({
  clientId,
  kinId,
  docs,
  errors,
  onChange,
}: {
  clientId: string | null;
  kinId: string | null;
  docs: DocSlotMap;
  errors?: Partial<Record<DocumentType, string>>;
  onChange: (docType: DocumentType, doc: ExistingDocument | null) => void;
  ensureOwner?: () => Promise<{ clientId: string; kinId: string | null }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {(["KIN_PHOTO", "CNIC_FRONT", "CNIC_BACK"] as const).map((docType) => (
        <DocumentUpload
          key={docType}
          ownerType="KIN"
          docType={docType}
          clientId={clientId}
          kinId={kinId}
          existing={docs[docType] ?? null}
          error={errors?.[docType]}
          onUploaded={(doc) => onChange(docType, doc)}
          onCleared={() => onChange(docType, null)}
        />
      ))}
    </div>
  );
}
