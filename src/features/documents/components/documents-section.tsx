"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "@phosphor-icons/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { DocumentType } from "@/db/schema/enums";
import type { UserRole } from "@/db/schema/enums";
import { can, type Action } from "@/lib/permissions";
import { getDocumentSignedUrls } from "../actions";
import { CLIENT_ALL_DOC_TYPES, DOC_TYPE_LABELS, KIN_ALL_DOC_TYPES } from "../constants";
import { flushPendingUploads } from "../upload-client";
import { DocumentUpload, type ExistingDocument } from "./document-upload";
import type { SignedDocumentUrls } from "../types";

export type DocumentListItem = {
  id: string;
  ownerType: "CLIENT" | "KIN";
  docType: DocumentType;
  mimeType: string;
  kinId?: string | null;
};

function Thumb({
  doc,
  label,
  previewUrl,
  fullUrl,
}: {
  doc: DocumentListItem;
  label: string;
  previewUrl: string | null;
  fullUrl: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const isPdf = doc.mimeType === "application/pdf";
  const thumb = previewUrl ?? fullUrl;
  const large = fullUrl ?? previewUrl;

  return (
    <>
      <button
        type="button"
        className="flex flex-col gap-1.5 text-left"
        onClick={() => setOpen(true)}
      >
        <span className="size-20 overflow-hidden rounded-[8px] border border-line bg-subtle">
          {thumb && !isPdf ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt={label} className="size-full object-cover" />
          ) : (
            <FileText weight="light" className="mx-auto mt-6 size-6 text-primary" />
          )}
        </span>
        <span className="text-[11px] text-ink-muted">{label}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl rounded-[16px] p-3">
          {large && !isPdf ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={large} alt={label} className="max-h-[80vh] w-full object-contain" />
          ) : large ? (
            <iframe title={label} src={large} className="h-[80vh] w-full rounded-[8px]" />
          ) : (
            <p className="p-6 text-[13px] text-ink-muted">Could not load document.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DocumentsSection({
  clientId,
  kinId,
  documents,
  initialUrls,
  urlKey,
  role,
  replacePermission,
}: {
  clientId: string;
  kinId: string | null;
  documents: DocumentListItem[];
  initialUrls?: SignedDocumentUrls[];
  urlKey: string;
  role: UserRole;
  replacePermission: Action;
  ensureOwner?: () => Promise<{ clientId: string; kinId: string | null }>;
}) {
  const canReplace = can(role, replacePermission);
  const ids = documents.map((d) => d.id);
  const { data: urls = [] } = useQuery({
    queryKey: ["doc-urls", urlKey],
    queryFn: () => getDocumentSignedUrls({ documentIds: ids }),
    initialData: initialUrls && initialUrls.length > 0 ? initialUrls : undefined,
    staleTime: 4 * 60 * 1000,
    enabled: ids.length > 0,
  });
  const urlById = React.useMemo(() => {
    const map = new Map(urls.map((row) => [row.id, row]));
    return map;
  }, [urls]);

  const [clientOverrides, setClientOverrides] = React.useState<
    Partial<Record<DocumentType, ExistingDocument | null>>
  >({});
  const [kinOverrides, setKinOverrides] = React.useState<
    Partial<Record<DocumentType, ExistingDocument | null>>
  >({});

  function getEffectiveDoc(
    ownerType: "CLIENT" | "KIN",
    docType: DocumentType,
  ): ExistingDocument | null {
    const overrides = ownerType === "CLIENT" ? clientOverrides : kinOverrides;
    if (docType in overrides) {
      return overrides[docType] ?? null;
    }
    const doc = documents.find((d) => d.ownerType === ownerType && d.docType === docType);
    if (!doc) return null;
    const signed = urlById.get(doc.id);
    return {
      id: doc.id,
      mimeType: doc.mimeType,
      previewUrl: signed?.previewUrl ?? null,
      fullUrl: signed?.fullUrl ?? null,
    };
  }

  async function flushSlot(
    ownerType: "CLIENT" | "KIN",
    docType: DocumentType,
    doc: ExistingDocument,
  ) {
    if (!doc.pendingFile) return;
    const saved = await flushPendingUploads({
      pending: [
        {
          ownerType,
          docType,
          file: doc.pendingFile,
          thumbFile: doc.pendingThumb,
        },
      ],
      clientId,
      kinId,
    });
    const row = saved.documents[0];
    if (!row) return;
    const slot = {
      id: row.id,
      mimeType: row.mimeType,
      previewUrl: doc.previewUrl ?? null,
      fullUrl: doc.fullUrl ?? null,
    };
    if (ownerType === "CLIENT")
      setClientOverrides((prev) => ({ ...prev, [docType]: slot }));
    else setKinOverrides((prev) => ({ ...prev, [docType]: slot }));
  }

  const clientItems = CLIENT_ALL_DOC_TYPES.map((type) =>
    documents.find((d) => d.ownerType === "CLIENT" && d.docType === type),
  ).filter((d): d is DocumentListItem => Boolean(d));
  const kinItems = KIN_ALL_DOC_TYPES.map((type) =>
    documents.find((d) => d.ownerType === "KIN" && d.docType === type),
  ).filter((d): d is DocumentListItem => Boolean(d));

  return (
    <div className="card space-y-4 p-5">
      <h4 className="text-[14px] font-semibold text-ink">Documents</h4>
      <div>
        <p className="mb-2 text-[12px] font-medium text-ink-muted uppercase">Client</p>
        <div className="flex flex-wrap gap-4">
          {clientItems.map((doc) => {
            const signed = urlById.get(doc.id);
            return (
              <Thumb
                key={doc.id}
                doc={doc}
                label={DOC_TYPE_LABELS[doc.docType]}
                previewUrl={signed?.previewUrl ?? null}
                fullUrl={signed?.fullUrl ?? null}
              />
            );
          })}
          {clientItems.length === 0 ? (
            <p className="text-[13px] text-ink-muted">No client documents on file.</p>
          ) : null}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[12px] font-medium text-ink-muted uppercase">
          Next of kin
        </p>
        <div className="flex flex-wrap gap-4">
          {kinItems.map((doc) => {
            const signed = urlById.get(doc.id);
            return (
              <Thumb
                key={doc.id}
                doc={doc}
                label={`Nominee ${DOC_TYPE_LABELS[doc.docType]}`}
                previewUrl={signed?.previewUrl ?? null}
                fullUrl={signed?.fullUrl ?? null}
              />
            );
          })}
          {kinItems.length === 0 ? (
            <p className="text-[13px] text-ink-muted">No nominee documents on file.</p>
          ) : null}
        </div>
      </div>
      {canReplace ? (
        <div className="space-y-4 border-t border-line pt-4">
          <p className="text-[12px] font-medium text-ink">Replace</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CLIENT_ALL_DOC_TYPES.map((docType) => (
              <DocumentUpload
                key={`c-${docType}`}
                ownerType="CLIENT"
                docType={docType}
                clientId={clientId}
                existing={getEffectiveDoc("CLIENT", docType)}
                onUploaded={(doc) => {
                  setClientOverrides((prev) => ({ ...prev, [docType]: doc }));
                  void flushSlot("CLIENT", docType, doc);
                }}
                onCleared={() =>
                  setClientOverrides((prev) => ({ ...prev, [docType]: null }))
                }
              />
            ))}
          </div>
          {kinId ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {KIN_ALL_DOC_TYPES.map((docType) => (
                <DocumentUpload
                  key={`k-${docType}`}
                  ownerType="KIN"
                  docType={docType}
                  clientId={clientId}
                  kinId={kinId}
                  existing={getEffectiveDoc("KIN", docType)}
                  onUploaded={(doc) => {
                    setKinOverrides((prev) => ({ ...prev, [docType]: doc }));
                    void flushSlot("KIN", docType, doc);
                  }}
                  onCleared={() =>
                    setKinOverrides((prev) => ({ ...prev, [docType]: null }))
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
