"use server";

import { randomUUID } from "node:crypto";
import { and, eq, isNull, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import type { DocumentType } from "@/db/schema/enums";
import { auditLog } from "@/db/schema/audit";
import { clientDocuments, clients, nextOfKin } from "@/db/schema/sales";
import { requireSession } from "@/lib/auth";
import { errorMessage, NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { assertCan, can } from "@/lib/permissions";
import { getSupabaseServer, isStorageConfigured } from "@/lib/supabase-server";
import { clientSchema, requiredNextOfKinSchema } from "@/features/sales/schema";
import { upsertClientAndKin } from "@/features/sales/client-upsert";
import {
  CLIENT_DOCUMENTS_BUCKET,
  MAX_DOCUMENT_BYTES,
  SIGNED_READ_SECONDS,
  thumbnailStoragePath,
} from "./constants";
import { listCurrentDocumentsForClient, loadSignedUrlsForDocumentIds } from "./queries";
import { timed } from "./timing";
import { requiredDocumentErrorMessage } from "./required";
import {
  assertAllowedMime,
  photoMimeError,
  photoOwnerError,
  clearDocumentSchema,
  completeUploadSchema,
  createUploadUrlSchema,
  documentIdSchema,
  documentIdsSchema,
  finalizeUploadsSchema,
  listDocumentsSchema,
  prepareUploadsSchema,
} from "./schema";

function parse<T>(
  schema: z.ZodType<T>,
  input: unknown,
  defaultMessage = "Invalid input",
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message ?? defaultMessage);
  }
  return result.data;
}

function assertCanManageDocuments(role: "ADMIN" | "INVENTORY_MANAGER" | "SALES") {
  if (!can(role, "bookings.create") && !can(role, "sales.create")) {
    assertCan(role, "bookings.create");
  }
}

function extFromMime(mime: string, fallback: string) {
  const cleaned = fallback.replace(/^\./, "").toLowerCase();
  if (cleaned === "jpeg") return "jpg";
  if (["jpg", "png", "webp", "pdf"].includes(cleaned)) return cleaned;
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "application/pdf") return "pdf";
  throw new ValidationError("Unsupported file type");
}

function buildStoragePath(opts: {
  ownerType: "CLIENT" | "KIN";
  clientId: string;
  kinId?: string;
  docType: string;
  ext: string;
}) {
  const file = `${opts.docType}-${randomUUID()}.${opts.ext}`;
  if (opts.ownerType === "KIN") {
    if (!opts.kinId)
      throw new ValidationError("Next of kin is required for this document");
    return `kin/${opts.kinId}/${file}`;
  }
  return `clients/${opts.clientId}/${file}`;
}

function assertPathMatches(opts: {
  storagePath: string;
  ownerType: "CLIENT" | "KIN";
  clientId: string;
  kinId?: string;
  docType: string;
}) {
  if (opts.ownerType === "KIN" && !opts.kinId) {
    throw new ValidationError("Next of kin is required for this document");
  }
  const expectedPrefix =
    opts.ownerType === "KIN" ? `kin/${opts.kinId}/` : `clients/${opts.clientId}/`;
  if (!opts.storagePath.startsWith(expectedPrefix)) {
    throw new ValidationError("Invalid storage path");
  }
  if (!opts.storagePath.includes(`${opts.docType}-`)) {
    throw new ValidationError("Invalid storage path");
  }
}

async function assertStorageObjectsExist(paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.storage
    .from(CLIENT_DOCUMENTS_BUCKET)
    .createSignedUrls(unique, 30);
  if (error) throw new ValidationError(error.message);
  const missing = unique.some((path, index) => {
    const item = data?.[index];
    return !item?.signedUrl || Boolean(item.error);
  });
  if (missing) {
    throw new ValidationError("Upload was not found in storage");
  }
}

function currentDocFilters(opts: {
  clientId: string;
  ownerType: "CLIENT" | "KIN";
  docType: DocumentType;
  kinId?: string;
}): SQL {
  const parts = [
    eq(clientDocuments.clientId, opts.clientId),
    eq(clientDocuments.ownerType, opts.ownerType),
    eq(clientDocuments.docType, opts.docType),
    isNull(clientDocuments.replacedAt),
  ];
  if (opts.ownerType === "KIN" && opts.kinId) {
    parts.push(eq(clientDocuments.kinId, opts.kinId));
  }
  return and(...parts)!;
}

export async function ensureClientForDocuments(input: unknown) {
  return timed("ensureClientForDocuments", async () => {
    const parsed = clientSchema.parse(input);
    const session = await requireSession();
    assertCanManageDocuments(session.user.role);

    return db.transaction(async (tx) => {
      const { client, kin } = await upsertClientAndKin(tx, parsed, null);
      const documents = await tx
        .select({
          id: clientDocuments.id,
          ownerType: clientDocuments.ownerType,
          clientId: clientDocuments.clientId,
          kinId: clientDocuments.kinId,
          docType: clientDocuments.docType,
          mimeType: clientDocuments.mimeType,
          replacedAt: clientDocuments.replacedAt,
        })
        .from(clientDocuments)
        .where(
          and(
            eq(clientDocuments.clientId, client.id),
            isNull(clientDocuments.replacedAt),
          ),
        );
      return { clientId: client.id, kinId: kin?.id ?? null, documents };
    });
  });
}

export async function ensureClientAndKinForDocuments(input: unknown) {
  return timed("ensureClientAndKinForDocuments", async () => {
    const body = parse(
      z.object({
        client: clientSchema,
        nextOfKin: requiredNextOfKinSchema,
      }),
      input,
    );
    const session = await requireSession();
    assertCanManageDocuments(session.user.role);

    return db.transaction(async (tx) => {
      const { client: saved, kin } = await upsertClientAndKin(
        tx,
        body.client,
        body.nextOfKin,
      );
      if (!kin) throw new ValidationError("Next of kin is required");
      const documents = await tx
        .select({
          id: clientDocuments.id,
          ownerType: clientDocuments.ownerType,
          clientId: clientDocuments.clientId,
          kinId: clientDocuments.kinId,
          docType: clientDocuments.docType,
          mimeType: clientDocuments.mimeType,
          replacedAt: clientDocuments.replacedAt,
        })
        .from(clientDocuments)
        .where(
          and(eq(clientDocuments.clientId, saved.id), isNull(clientDocuments.replacedAt)),
        );
      return { clientId: saved.id, kinId: kin.id, documents };
    });
  });
}

export async function listClientDocuments(input: unknown) {
  const parsed = parse(listDocumentsSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "bookings.read");
  return listCurrentDocumentsForClient(parsed.clientId);
}

export async function createDocumentUploadUrl(input: unknown) {
  return timed("createDocumentUploadUrl", async () => {
    const parsed = parse(createUploadUrlSchema, input);
    const session = await requireSession();
    assertCanManageDocuments(session.user.role);

    if (!assertAllowedMime(parsed.docType, parsed.mimeType)) {
      throw new ValidationError(photoMimeError(parsed.docType));
    }
    const ownerError = photoOwnerError(parsed.docType, parsed.ownerType);
    if (ownerError) throw new ValidationError(ownerError);
    if (parsed.ownerType === "KIN" && !parsed.kinId) {
      throw new ValidationError("Save next of kin details before uploading documents");
    }

    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.id, parsed.clientId))
      .limit(1);
    if (!client) throw new NotFoundError("Client not found");

    if (parsed.ownerType === "KIN" && parsed.kinId) {
      const [kin] = await db
        .select({ id: nextOfKin.id, clientId: nextOfKin.clientId })
        .from(nextOfKin)
        .where(eq(nextOfKin.id, parsed.kinId))
        .limit(1);
      if (!kin || kin.clientId !== parsed.clientId) {
        throw new NotFoundError("Next of kin not found");
      }
    }

    const ext = extFromMime(parsed.mimeType, parsed.fileExt);
    const storagePath = buildStoragePath({
      ownerType: parsed.ownerType,
      clientId: parsed.clientId,
      kinId: parsed.kinId,
      docType: parsed.docType,
      ext,
    });

    const supabase = getSupabaseServer();
    const { data, error } = await supabase.storage
      .from(CLIENT_DOCUMENTS_BUCKET)
      .createSignedUploadUrl(storagePath);
    if (error || !data) {
      throw new ValidationError(error?.message ?? "Could not create upload URL");
    }

    return {
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      mimeType: parsed.mimeType,
    };
  });
}

export async function completeDocumentUpload(input: unknown) {
  return timed("completeDocumentUpload", async () => {
    const parsed = parse(completeUploadSchema, input);
    const session = await requireSession();
    assertCanManageDocuments(session.user.role);

    if (parsed.sizeBytes > MAX_DOCUMENT_BYTES) {
      throw new ValidationError("File must be 5 MB or smaller");
    }
    if (!assertAllowedMime(parsed.docType, parsed.mimeType)) {
      throw new ValidationError("Unsupported file type");
    }
    assertPathMatches(parsed);

    await assertStorageObjectsExist([parsed.storagePath]);

    const now = new Date();
    const saved = await db.transaction(async (tx) => {
      const currentRows = await tx
        .select()
        .from(clientDocuments)
        .where(
          currentDocFilters({
            clientId: parsed.clientId,
            ownerType: parsed.ownerType,
            docType: parsed.docType,
            kinId: parsed.kinId,
          }),
        );

      if (currentRows.length > 0) {
        await tx
          .update(clientDocuments)
          .set({ replacedAt: now })
          .where(
            currentDocFilters({
              clientId: parsed.clientId,
              ownerType: parsed.ownerType,
              docType: parsed.docType,
              kinId: parsed.kinId,
            }),
          );
      }

      const [row] = await tx
        .insert(clientDocuments)
        .values({
          ownerType: parsed.ownerType,
          clientId: parsed.clientId,
          kinId: parsed.ownerType === "KIN" ? (parsed.kinId ?? null) : null,
          docType: parsed.docType,
          storagePath: parsed.storagePath,
          mimeType: parsed.mimeType,
          sizeBytes: parsed.sizeBytes,
          uploadedBy: session.user.id,
        })
        .returning();

      if (!row) throw new ValidationError("Failed to save document");

      await tx.insert(auditLog).values({
        actorId: session.user.id,
        entity: "client_document",
        entityId: row.id,
        action: currentRows.length > 0 ? "UPDATE" : "CREATE",
        before:
          currentRows[0] != null
            ? {
                id: currentRows[0].id,
                storagePath: currentRows[0].storagePath,
                docType: currentRows[0].docType,
              }
            : null,
        after: {
          id: row.id,
          storagePath: row.storagePath,
          docType: row.docType,
          ownerType: row.ownerType,
          clientId: row.clientId,
          kinId: row.kinId,
        },
      });

      return row;
    });

    revalidatePath("/bookings");
    revalidatePath("/sold");
    return {
      id: saved.id,
      ownerType: saved.ownerType,
      clientId: saved.clientId,
      kinId: saved.kinId,
      docType: saved.docType,
      mimeType: saved.mimeType,
    };
  });
}

export async function getDocumentSignedUrl(input: unknown) {
  return timed("getDocumentSignedUrl", async () => {
    const parsed = parse(documentIdSchema, input);
    const session = await requireSession();
    assertCan(session.user.role, "bookings.read");

    const [row] = await db
      .select()
      .from(clientDocuments)
      .where(eq(clientDocuments.id, parsed.documentId))
      .limit(1);
    if (!row) throw new NotFoundError("Document not found");

    const supabase = getSupabaseServer();
    const { data, error } = await supabase.storage
      .from(CLIENT_DOCUMENTS_BUCKET)
      .createSignedUrl(row.storagePath, SIGNED_READ_SECONDS);
    if (error || !data) {
      throw new ValidationError(error?.message ?? "Could not create a signed URL");
    }
    return { url: data.signedUrl, mimeType: row.mimeType, docType: row.docType };
  });
}

export async function clearCurrentDocument(input: unknown) {
  return timed("clearCurrentDocument", async () => {
    const parsed = parse(clearDocumentSchema, input);
    const session = await requireSession();
    assertCanManageDocuments(session.user.role);

    const [row] = await db
      .select()
      .from(clientDocuments)
      .where(
        and(
          eq(clientDocuments.id, parsed.documentId),
          isNull(clientDocuments.replacedAt),
        ),
      )
      .limit(1);
    if (!row) throw new NotFoundError("Document not found");

    await db.transaction(async (tx) => {
      await tx
        .update(clientDocuments)
        .set({ replacedAt: new Date() })
        .where(eq(clientDocuments.id, row.id));
      await tx.insert(auditLog).values({
        actorId: session.user.id,
        entity: "client_document",
        entityId: row.id,
        action: "UPDATE",
        before: { id: row.id, storagePath: row.storagePath, docType: row.docType },
        after: { id: row.id, replaced: true },
      });
    });

    revalidatePath("/bookings");
    revalidatePath("/sold");
    return { ok: true as const };
  });
}

export async function assertRequiredDocumentsForClient(clientId: string, kinId: string) {
  const docs = await listCurrentDocumentsForClient(clientId);
  const relevant = docs.filter(
    (doc) =>
      doc.ownerType === "CLIENT" || (doc.ownerType === "KIN" && doc.kinId === kinId),
  );
  const message = requiredDocumentErrorMessage(relevant);
  if (message) throw new ValidationError(message);
}

export async function prepareUploads(input: unknown) {
  return timed("prepareUploads", async () => {
    try {
      const parsed = parse(prepareUploadsSchema, input);
      const session = await requireSession();
      assertCanManageDocuments(session.user.role);

      if (!isStorageConfigured()) {
        return {
          ok: false as const,
          error:
            "Document storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        };
      }

      for (const doc of parsed.docs) {
        if (doc.sizeBytes > MAX_DOCUMENT_BYTES) {
          throw new ValidationError("File must be 5 MB or smaller");
        }
        if (!assertAllowedMime(doc.docType, doc.mimeType)) {
          throw new ValidationError(photoMimeError(doc.docType));
        }
        const ownerError = photoOwnerError(doc.docType, doc.ownerType);
        if (ownerError) throw new ValidationError(ownerError);
      }

      const needsKin = parsed.docs.some((doc) => doc.ownerType === "KIN");
      const ids = await db.transaction(async (tx) => {
        let clientId = parsed.clientId;
        let kinId = parsed.kinId ?? null;
        if (parsed.client) {
          const { client, kin } = await upsertClientAndKin(
            tx,
            parsed.client,
            parsed.nextOfKin ?? null,
          );
          clientId = client.id;
          kinId = kin?.id ?? kinId;
        }
        if (!clientId) {
          throw new ValidationError("Save client details before uploading documents");
        }
        if (needsKin && !kinId) {
          throw new ValidationError(
            "Save next of kin details before uploading CNIC scans",
          );
        }
        return { clientId, kinId };
      });

      const supabase = getSupabaseServer();
      const uploads = await Promise.all(
        parsed.docs.map(async (doc) => {
          const ext = extFromMime(doc.mimeType, doc.fileExt);
          const storagePath = buildStoragePath({
            ownerType: doc.ownerType,
            clientId: ids.clientId,
            kinId: ids.kinId ?? undefined,
            docType: doc.docType,
            ext,
          });
          const { data, error } = await supabase.storage
            .from(CLIENT_DOCUMENTS_BUCKET)
            .createSignedUploadUrl(storagePath);
          if (error || !data) {
            throw new ValidationError(error?.message ?? "Could not create upload URL");
          }
          let thumbnail: { path: string; token: string; signedUrl: string } | undefined;
          if (doc.hasThumbnail) {
            const thumbPath = thumbnailStoragePath(storagePath);
            const thumb = await supabase.storage
              .from(CLIENT_DOCUMENTS_BUCKET)
              .createSignedUploadUrl(thumbPath);
            if (thumb.error || !thumb.data) {
              throw new ValidationError(
                thumb.error?.message ?? "Could not create thumbnail URL",
              );
            }
            thumbnail = {
              path: thumb.data.path,
              token: thumb.data.token,
              signedUrl: thumb.data.signedUrl,
            };
          }
          return {
            ownerType: doc.ownerType,
            docType: doc.docType,
            path: data.path,
            token: data.token,
            signedUrl: data.signedUrl,
            mimeType: doc.mimeType,
            thumbnail,
          };
        }),
      );

      return { ok: true as const, clientId: ids.clientId, kinId: ids.kinId, uploads };
    } catch (err) {
      logger.error({ err }, "prepareUploads failed");
      return { ok: false as const, error: errorMessage(err) };
    }
  });
}

export async function finalizeUploads(input: unknown) {
  return timed("finalizeUploads", async () => {
    try {
      const parsed = parse(finalizeUploadsSchema, input);
      const session = await requireSession();
      assertCanManageDocuments(session.user.role);

      const storagePaths: string[] = [];
      for (const doc of parsed.docs) {
        assertPathMatches({
          storagePath: doc.storagePath,
          ownerType: doc.ownerType,
          clientId: parsed.clientId,
          kinId: parsed.kinId,
          docType: doc.docType,
        });
        if (doc.sizeBytes > MAX_DOCUMENT_BYTES) {
          throw new ValidationError("File must be 5 MB or smaller");
        }
        if (!assertAllowedMime(doc.docType, doc.mimeType)) {
          throw new ValidationError("Unsupported file type");
        }
        if (
          doc.thumbnailPath &&
          doc.thumbnailPath !== thumbnailStoragePath(doc.storagePath)
        ) {
          throw new ValidationError("Invalid thumbnail path");
        }
        storagePaths.push(doc.storagePath);
      }
      await assertStorageObjectsExist(storagePaths);

      const now = new Date();
      const saved = await db.transaction(async (tx) => {
        const rows = [];
        for (const doc of parsed.docs) {
          const currentRows = await tx
            .select()
            .from(clientDocuments)
            .where(
              currentDocFilters({
                clientId: parsed.clientId,
                ownerType: doc.ownerType,
                docType: doc.docType,
                kinId: parsed.kinId,
              }),
            );
          if (currentRows.length > 0) {
            await tx
              .update(clientDocuments)
              .set({ replacedAt: now })
              .where(
                currentDocFilters({
                  clientId: parsed.clientId,
                  ownerType: doc.ownerType,
                  docType: doc.docType,
                  kinId: parsed.kinId,
                }),
              );
          }
          const [row] = await tx
            .insert(clientDocuments)
            .values({
              ownerType: doc.ownerType,
              clientId: parsed.clientId,
              kinId: doc.ownerType === "KIN" ? (parsed.kinId ?? null) : null,
              docType: doc.docType,
              storagePath: doc.storagePath,
              mimeType: doc.mimeType,
              sizeBytes: doc.sizeBytes,
              uploadedBy: session.user.id,
            })
            .returning();
          if (!row) throw new ValidationError("Failed to save document");
          await tx.insert(auditLog).values({
            actorId: session.user.id,
            entity: "client_document",
            entityId: row.id,
            action: currentRows.length > 0 ? "UPDATE" : "CREATE",
            before:
              currentRows[0] != null
                ? {
                    id: currentRows[0].id,
                    storagePath: currentRows[0].storagePath,
                    docType: currentRows[0].docType,
                  }
                : null,
            after: {
              id: row.id,
              storagePath: row.storagePath,
              docType: row.docType,
              ownerType: row.ownerType,
              clientId: row.clientId,
              kinId: row.kinId,
            },
          });
          rows.push(row);
        }
        return rows;
      });

      revalidatePath("/bookings");
      revalidatePath("/sold");
      return {
        ok: true as const,
        clientId: parsed.clientId,
        kinId: parsed.kinId ?? null,
        documents: saved.map((row) => ({
          id: row.id,
          ownerType: row.ownerType,
          clientId: row.clientId,
          kinId: row.kinId,
          docType: row.docType,
          mimeType: row.mimeType,
        })),
      };
    } catch (err) {
      logger.error({ err }, "finalizeUploads failed");
      return { ok: false as const, error: errorMessage(err) };
    }
  });
}

export async function getDocumentSignedUrls(input: unknown) {
  return timed("getDocumentSignedUrls", async () => {
    const parsed = parse(documentIdsSchema, input);
    const session = await requireSession();
    assertCan(session.user.role, "bookings.read");
    return loadSignedUrlsForDocumentIds(parsed.documentIds);
  });
}
