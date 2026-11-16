import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { clientDocuments } from "@/db/schema/sales";
import { getSupabaseServer } from "@/lib/supabase-server";
import {
  CLIENT_DOCUMENTS_BUCKET,
  SIGNED_READ_SECONDS,
  thumbnailStoragePath,
} from "./constants";
import { timed } from "./timing";
import type { SignedDocumentUrls } from "./types";

export type { SignedDocumentUrls };

export async function listCurrentDocumentsForClient(clientId: string) {
  return db
    .select({
      id: clientDocuments.id,
      ownerType: clientDocuments.ownerType,
      clientId: clientDocuments.clientId,
      kinId: clientDocuments.kinId,
      docType: clientDocuments.docType,
      storagePath: clientDocuments.storagePath,
      mimeType: clientDocuments.mimeType,
      sizeBytes: clientDocuments.sizeBytes,
      createdAt: clientDocuments.createdAt,
      replacedAt: clientDocuments.replacedAt,
    })
    .from(clientDocuments)
    .where(
      and(eq(clientDocuments.clientId, clientId), isNull(clientDocuments.replacedAt)),
    );
}

export async function getCurrentDocumentRow(opts: {
  clientId: string;
  ownerType: "CLIENT" | "KIN";
  docType: "PHOTO" | "CNIC_FRONT" | "CNIC_BACK" | "KIN_PHOTO";
  kinId?: string | null;
}) {
  const filters = [
    eq(clientDocuments.clientId, opts.clientId),
    eq(clientDocuments.ownerType, opts.ownerType),
    eq(clientDocuments.docType, opts.docType),
    isNull(clientDocuments.replacedAt),
  ];
  if (opts.ownerType === "KIN" && opts.kinId) {
    filters.push(eq(clientDocuments.kinId, opts.kinId));
  }
  const [row] = await db
    .select()
    .from(clientDocuments)
    .where(and(...filters))
    .limit(1);
  return row ?? null;
}

export async function signDocumentUrls(
  docs: { id: string; storagePath: string; mimeType: string }[],
): Promise<SignedDocumentUrls[]> {
  return timed("signDocumentUrls", async () => {
    if (docs.length === 0) return [];
    const supabase = getSupabaseServer();
    const pathToDoc = new Map<string, string>();
    const paths: string[] = [];
    for (const doc of docs) {
      paths.push(doc.storagePath);
      pathToDoc.set(doc.storagePath, doc.id);
      if (doc.mimeType.startsWith("image/")) {
        const thumb = thumbnailStoragePath(doc.storagePath);
        paths.push(thumb);
        pathToDoc.set(thumb, doc.id);
      }
    }
    const { data, error } = await supabase.storage
      .from(CLIENT_DOCUMENTS_BUCKET)
      .createSignedUrls(paths, SIGNED_READ_SECONDS);
    if (error) {
      throw error;
    }
    const byId = new Map<string, SignedDocumentUrls>();
    for (const doc of docs) {
      byId.set(doc.id, {
        id: doc.id,
        previewUrl: null,
        fullUrl: null,
        mimeType: doc.mimeType,
      });
    }
    (data ?? []).forEach((item, index) => {
      const path = item.path || paths[index];
      if (!item.signedUrl || item.error || !path) return;
      const docId = pathToDoc.get(path);
      if (!docId) return;
      const row = byId.get(docId);
      if (!row) return;
      if (path.includes("-thumb.")) {
        row.previewUrl = item.signedUrl;
      } else {
        row.fullUrl = item.signedUrl;
      }
    });
    return [...byId.values()].map((row) => ({
      ...row,
      previewUrl: row.previewUrl ?? row.fullUrl,
    }));
  });
}

export async function loadSignedUrlsForDocumentIds(documentIds: string[]) {
  if (documentIds.length === 0) return [];
  const rows = await db
    .select({
      id: clientDocuments.id,
      storagePath: clientDocuments.storagePath,
      mimeType: clientDocuments.mimeType,
    })
    .from(clientDocuments)
    .where(inArray(clientDocuments.id, documentIds));
  return signDocumentUrls(rows);
}
