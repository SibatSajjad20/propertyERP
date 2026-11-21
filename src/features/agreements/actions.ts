"use server";

import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { agreements, bookings, sales } from "@/db/schema/sales";
import { CLIENT_DOCUMENTS_BUCKET } from "@/features/documents/constants";
import { requireSession } from "@/lib/auth";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import { getSupabaseServer, isStorageConfigured } from "@/lib/supabase-server";
import {
  completeSignedAgreementUploadSchema,
  createAgreementSchema,
  createSignedAgreementUploadUrlSchema,
  updateAgreementSchema,
} from "./schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function nextAgreementNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SM-AGR-${year}-`;
  const [maxRow] = await tx
    .select({
      maxSeq: sql<number>`COALESCE(MAX(CASE WHEN SUBSTR(${agreements.agreementNo}, ${prefix.length + 1}) ~ '^[0-9]+$' THEN SUBSTR(${agreements.agreementNo}, ${prefix.length + 1})::int ELSE 0 END), 0)::int`,
    })
    .from(agreements)
    .where(sql`${agreements.agreementNo} LIKE ${prefix + "%"}`);
  const seq = Number(maxRow?.maxSeq ?? 0) + 1;
  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

export async function createAgreement(input: unknown) {
  const session = await requireSession();
  assertCan(session.user.role, "agreements.manage");

  const parsed = createAgreementSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Invalid agreement data",
    );
  }
  const data = parsed.data;

  const created = await db.transaction(async (tx) => {
    let unitId: string;
    let clientId: string;
    const bookingId = data.bookingId || null;
    const saleId = data.saleId || null;

    if (bookingId) {
      const [bk] = await tx
        .select({ unitId: bookings.unitId, clientId: bookings.clientId })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);
      if (!bk) throw new NotFoundError("Linked booking not found");
      unitId = bk.unitId;
      clientId = bk.clientId;
    } else if (saleId) {
      const [sl] = await tx
        .select({ unitId: sales.unitId, clientId: sales.clientId })
        .from(sales)
        .where(eq(sales.id, saleId))
        .limit(1);
      if (!sl) throw new NotFoundError("Linked sale not found");
      unitId = sl.unitId;
      clientId = sl.clientId;
    } else {
      throw new ValidationError("Select a booking or sale record");
    }

    const agreementNo = await nextAgreementNumber(tx);
    const agreementDate = data.agreementDate ? new Date(data.agreementDate) : new Date();

    const [row] = await tx
      .insert(agreements)
      .values({
        agreementNo,
        bookingId,
        saleId,
        unitId,
        clientId,
        sellerName: data.sellerName,
        agreementDate,
        anticipatedCompletionDate: data.anticipatedCompletionDate,
        buyerNationality: data.buyerNationality,
        nomineeNationality: data.nomineeNationality,
        witness1Name: data.witness1Name?.trim() || null,
        witness2Name: data.witness2Name?.trim() || null,
        notes: data.notes?.trim() || null,
        status: "GENERATED",
        createdBy: session.user.id,
      })
      .returning();

    if (!row) throw new ValidationError("Failed to create agreement");

    await tx.insert(auditLog).values({
      actorId: session.user.id,
      entity: "agreement",
      entityId: row.id,
      action: "AGREEMENT_CREATE",
      before: null,
      after: {
        agreementNo: row.agreementNo,
        bookingId,
        saleId,
        unitId,
        clientId,
      },
    });

    return row;
  });

  revalidatePath("/agreements");
  revalidatePath(`/agreements/${created.id}`);
  return {
    id: created.id,
    agreementNo: created.agreementNo,
  };
}

export async function updateAgreement(input: unknown) {
  const session = await requireSession();
  assertCan(session.user.role, "agreements.manage");

  const parsed = updateAgreementSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Invalid agreement data",
    );
  }
  const data = parsed.data;

  const [updated] = await db
    .update(agreements)
    .set({
      sellerName: data.sellerName,
      agreementDate: new Date(data.agreementDate),
      anticipatedCompletionDate: data.anticipatedCompletionDate,
      buyerNationality: data.buyerNationality,
      nomineeNationality: data.nomineeNationality,
      witness1Name: data.witness1Name?.trim() || null,
      witness2Name: data.witness2Name?.trim() || null,
      notes: data.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(agreements.id, data.id))
    .returning();

  if (!updated) throw new NotFoundError("Agreement not found");

  revalidatePath("/agreements");
  revalidatePath(`/agreements/${data.id}`);
  return { success: true, id: updated.id };
}

function extForAgreementMime(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new ValidationError("Unsupported file format");
  }
}

export async function createSignedAgreementUploadUrl(input: unknown) {
  const session = await requireSession();
  assertCan(session.user.role, "agreements.manage");

  const parsed = createSignedAgreementUploadUrlSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Invalid upload request",
    );
  }

  if (!isStorageConfigured()) {
    throw new ValidationError("File storage is not configured.");
  }

  const ext = extForAgreementMime(parsed.data.mimeType);
  const storagePath = `agreements/${parsed.data.agreementId}/${randomUUID()}.${ext}`;
  const supabase = getSupabaseServer();

  const { data, error } = await supabase.storage
    .from(CLIENT_DOCUMENTS_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new ValidationError(error?.message ?? "Failed to create upload URL");
  }

  return {
    storagePath,
    uploadUrl: data.signedUrl,
    token: data.token,
  };
}

export async function completeSignedAgreementUpload(input: unknown) {
  const session = await requireSession();
  assertCan(session.user.role, "agreements.manage");

  const parsed = completeSignedAgreementUploadSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Invalid upload metadata",
    );
  }

  if (!parsed.data.storagePath.startsWith(`agreements/${parsed.data.agreementId}/`)) {
    throw new ValidationError("Invalid storage path");
  }

  const now = new Date();
  const [updated] = await db
    .update(agreements)
    .set({
      status: "SIGNED_UPLOADED",
      signedStoragePath: parsed.data.storagePath,
      signedMimeType: parsed.data.mimeType,
      signedFileName: parsed.data.fileName,
      signedUploadedAt: now,
      signedUploadedBy: session.user.id,
      updatedAt: now,
    })
    .where(eq(agreements.id, parsed.data.agreementId))
    .returning();

  if (!updated) throw new NotFoundError("Agreement not found");

  await db.insert(auditLog).values({
    actorId: session.user.id,
    entity: "agreement",
    entityId: updated.id,
    action: "AGREEMENT_UPLOAD",
    before: null,
    after: {
      agreementNo: updated.agreementNo,
      signedFileName: parsed.data.fileName,
      status: "SIGNED_UPLOADED",
    },
  });

  revalidatePath("/agreements");
  revalidatePath(`/agreements/${updated.id}`);
  return { success: true, id: updated.id };
}
