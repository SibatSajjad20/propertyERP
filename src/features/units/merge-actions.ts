"use server";

import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { categories, floors } from "@/db/schema/property";
import {
  unitMergeRequests,
  unitMergeSources,
  units,
  type MergeSourceSnapshot,
} from "@/db/schema/units";
import { CLIENT_DOCUMENTS_BUCKET } from "@/features/documents/constants";
import { effectivePricingArea, formatUnitNumberLabel } from "@/lib/area";
import { requireSession } from "@/lib/auth";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { computeTotalPrice } from "@/lib/money";
import { assertCan, can } from "@/lib/permissions";
import { getSupabaseServer, isStorageConfigured } from "@/lib/supabase-server";
import {
  approveMergeRequestSchema,
  createMergeProofUrlSchema,
  createMergeRequestSchema,
  rejectMergeRequestSchema,
} from "./merge-schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function revalidateMergePaths(unitIds: string[] = []) {
  revalidateTag("dashboard", "max");
  revalidateTag("report-summary", "max");
  revalidatePath("/inventory");
  revalidatePath("/inventory/merges");
  revalidatePath("/dashboard");
  for (const id of unitIds) {
    revalidatePath(`/units/${id}`);
  }
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      throw new ValidationError("Unsupported proof file type");
  }
}

export async function createMergeProofUploadUrl(input: unknown) {
  const session = await requireSession();
  assertCan(session.user.role, "units.merge_request");

  const parsed = createMergeProofUrlSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Invalid upload request",
    );
  }

  if (!isStorageConfigured()) {
    throw new ValidationError(
      "File storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const ext = extFromMime(parsed.data.mimeType);
  const storagePath = `merge-proofs/${randomUUID()}.${ext}`;
  const supabase = getSupabaseServer();

  const { data, error } = await supabase.storage
    .from(CLIENT_DOCUMENTS_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new ValidationError(error?.message ?? "Failed to create proof upload URL");
  }

  return {
    storagePath,
    uploadUrl: data.signedUrl,
    token: data.token,
  };
}

async function executeApprovedMergeInTx(
  tx: Tx,
  request: typeof unitMergeRequests.$inferSelect,
  adminUserId: string,
  overrides?: {
    proposedUnitCode?: string;
    proposedUnitNumber?: string;
    targetFloorId?: string;
    targetCategoryId?: string;
    proposedNetAreaSqft?: string;
    proposedGrossAreaSqft?: string;
    proposedRatePerSqftPkr?: string;
    proposedPriceAdjustmentPkr?: string;
    proposedPriceAdjustmentReason?: string | null;
  },
) {
  const sourceIds = request.sourceUnitsSnapshot.map((s) => s.id);
  if (sourceIds.length < 2 || sourceIds.length > 3) {
    throw new ValidationError("Merge must include 2 or 3 source units.");
  }

  // Lock source units
  const lockedSources = await tx
    .select()
    .from(units)
    .where(and(inArray(units.id, sourceIds), isNull(units.archivedAt)))
    .for("update");

  if (lockedSources.length !== sourceIds.length) {
    throw new ConflictError(
      "One or more source units are no longer active or have already been merged.",
    );
  }

  for (const src of lockedSources) {
    if (src.status !== "AVAILABLE") {
      throw new ConflictError(
        `Source unit ${src.unitCode} is ${src.status}. Only AVAILABLE units can be merged.`,
      );
    }
  }

  const finalUnitCode = (
    overrides?.proposedUnitCode ?? request.proposedUnitCode
  ).toUpperCase();
  const finalCategoryId = overrides?.targetCategoryId ?? request.targetCategoryId;
  const finalFloorId = overrides?.targetFloorId ?? request.targetFloorId;
  const finalNetArea = overrides?.proposedNetAreaSqft ?? request.proposedNetAreaSqft;
  const finalGrossArea =
    overrides?.proposedGrossAreaSqft ?? request.proposedGrossAreaSqft;
  const finalRate = overrides?.proposedRatePerSqftPkr ?? request.proposedRatePerSqftPkr;
  const finalAdj =
    overrides?.proposedPriceAdjustmentPkr ?? request.proposedPriceAdjustmentPkr;
  const finalAdjReason =
    overrides?.proposedPriceAdjustmentReason !== undefined
      ? overrides.proposedPriceAdjustmentReason
      : request.proposedPriceAdjustmentReason;

  const [targetCat] = await tx
    .select({
      id: categories.id,
      name: categories.name,
      isSellableDefault: categories.isSellableDefault,
    })
    .from(categories)
    .where(eq(categories.id, finalCategoryId))
    .limit(1);

  if (!targetCat) {
    throw new NotFoundError("Target category not found");
  }

  const finalUnitNumber = formatUnitNumberLabel(
    finalUnitCode,
    overrides?.proposedUnitNumber ?? request.proposedUnitNumber,
    targetCat.name,
  );

  // Check unit code uniqueness (unless it matches one of the source units being archived? No, unique index is on (property_id, unit_code) across all rows, so new unit code must be unique)
  const [duplicate] = await tx
    .select({ id: units.id })
    .from(units)
    .where(
      and(eq(units.propertyId, request.propertyId), eq(units.unitCode, finalUnitCode)),
    )
    .limit(1);

  if (duplicate) {
    throw new ConflictError(
      `Unit code "${finalUnitCode}" already exists. Please use a distinct combined unit code (e.g. ${finalUnitCode}-M).`,
    );
  }

  const sourceCodes = request.sourceUnitsSnapshot.map((s) => s.unitCode).join(" + ");
  const mergeNotes = `Merged from ${sourceCodes}. Reason: ${request.reason}`;

  // Create the new merged unit
  const [newUnit] = await tx
    .insert(units)
    .values({
      propertyId: request.propertyId,
      unitCode: finalUnitCode,
      unitNumber: finalUnitNumber,
      floorId: finalFloorId,
      categoryId: finalCategoryId,
      netAreaSqft: finalNetArea,
      grossAreaSqft: finalGrossArea,
      ratePerSqftPkr: finalRate,
      priceAdjustmentPkr: finalAdj,
      priceAdjustmentReason: finalAdjReason,
      status: "AVAILABLE",
      isSellable: targetCat.isSellableDefault,
      isMergedUnit: true,
      notes: mergeNotes,
    })
    .returning();

  if (!newUnit) {
    throw new ValidationError("Failed to create merged unit");
  }

  const now = new Date();

  // Archive source units and link them to the new merged unit
  await tx
    .update(units)
    .set({
      mergedIntoUnitId: newUnit.id,
      archivedAt: now,
      isSellable: false,
      notes: `Merged into ${newUnit.unitCode} on ${now.toISOString().slice(0, 10)}`,
      updatedAt: now,
    })
    .where(inArray(units.id, sourceIds));

  // Update merge sources with the resulting merged unit id
  await tx
    .update(unitMergeSources)
    .set({ mergedUnitId: newUnit.id })
    .where(eq(unitMergeSources.mergeRequestId, request.id));

  // Update merge request record
  await tx
    .update(unitMergeRequests)
    .set({
      status: "APPROVED",
      proposedUnitCode: finalUnitCode,
      proposedUnitNumber: finalUnitNumber,
      targetFloorId: finalFloorId,
      targetCategoryId: finalCategoryId,
      proposedNetAreaSqft: finalNetArea,
      proposedGrossAreaSqft: finalGrossArea,
      proposedRatePerSqftPkr: finalRate,
      proposedPriceAdjustmentPkr: finalAdj,
      proposedPriceAdjustmentReason: finalAdjReason,
      resultingUnitId: newUnit.id,
      reviewedBy: adminUserId,
      reviewedAt: now,
      updatedAt: now,
    })
    .where(eq(unitMergeRequests.id, request.id));

  // Audit log
  await tx.insert(auditLog).values({
    actorId: adminUserId,
    entity: "unit_merge",
    entityId: newUnit.id,
    action: "UNIT_MERGE_APPROVE",
    before: { sourceUnits: request.sourceUnitsSnapshot },
    after: {
      mergeRequestId: request.id,
      newUnitId: newUnit.id,
      unitCode: newUnit.unitCode,
      grossAreaSqft: newUnit.grossAreaSqft,
      netAreaSqft: newUnit.netAreaSqft,
      ratePerSqftPkr: newUnit.ratePerSqftPkr,
      reason: request.reason,
    },
  });

  return newUnit;
}

export async function requestUnitMerge(input: unknown) {
  const session = await requireSession();
  assertCan(session.user.role, "units.merge_request");

  const parsed = createMergeRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid merge request");
  }
  const data = parsed.data;

  if (!data.proofStoragePath.startsWith("merge-proofs/")) {
    throw new ValidationError("Invalid proof document path.");
  }

  const result = await db.transaction(async (tx) => {
    const sourceRows = await tx
      .select({
        id: units.id,
        propertyId: units.propertyId,
        unitCode: units.unitCode,
        unitNumber: units.unitNumber,
        status: units.status,
        floorId: units.floorId,
        floorName: floors.name,
        categoryId: units.categoryId,
        categoryName: categories.name,
        netAreaSqft: units.netAreaSqft,
        grossAreaSqft: units.grossAreaSqft,
        ratePerSqftPkr: units.ratePerSqftPkr,
        priceAdjustmentPkr: units.priceAdjustmentPkr,
      })
      .from(units)
      .innerJoin(floors, eq(floors.id, units.floorId))
      .innerJoin(categories, eq(categories.id, units.categoryId))
      .where(and(inArray(units.id, data.sourceUnitIds), isNull(units.archivedAt)));

    if (sourceRows.length !== data.sourceUnitIds.length) {
      throw new ValidationError("One or more selected units could not be found.");
    }

    const propertyIds = new Set(sourceRows.map((u) => u.propertyId));
    if (propertyIds.size > 1) {
      throw new ValidationError("Merged units must belong to the same property.");
    }

    for (const u of sourceRows) {
      if (u.status !== "AVAILABLE") {
        throw new ValidationError(
          `Unit ${u.unitCode} is currently ${u.status}. Only AVAILABLE units can be merged.`,
        );
      }
    }

    const propertyId = sourceRows[0]!.propertyId;

    // Verify no pending merge already references any of these source units
    const existingPending = await tx
      .select({ sourceUnitId: unitMergeSources.sourceUnitId })
      .from(unitMergeSources)
      .innerJoin(
        unitMergeRequests,
        eq(unitMergeRequests.id, unitMergeSources.mergeRequestId),
      )
      .where(
        and(
          inArray(unitMergeSources.sourceUnitId, data.sourceUnitIds),
          eq(unitMergeRequests.status, "PENDING"),
        ),
      )
      .limit(1);

    if (existingPending.length > 0) {
      throw new ConflictError(
        "One of the selected units already has a pending merge request awaiting admin approval.",
      );
    }

    const snapshots: MergeSourceSnapshot[] = sourceRows.map((u) => {
      const pricingArea = effectivePricingArea(u.grossAreaSqft, u.netAreaSqft);
      return {
        id: u.id,
        unitCode: u.unitCode,
        unitNumber: u.unitNumber,
        floorId: u.floorId,
        floorName: u.floorName,
        categoryId: u.categoryId,
        categoryName: u.categoryName,
        netAreaSqft: u.netAreaSqft,
        grossAreaSqft: u.grossAreaSqft,
        ratePerSqftPkr: u.ratePerSqftPkr,
        priceAdjustmentPkr: u.priceAdjustmentPkr,
        computedPricePkr: computeTotalPrice(
          u.ratePerSqftPkr,
          pricingArea,
          u.priceAdjustmentPkr,
        ),
      };
    });

    const [createdReq] = await tx
      .insert(unitMergeRequests)
      .values({
        propertyId,
        status: "PENDING",
        proposedUnitCode: data.proposedUnitCode,
        proposedUnitNumber: data.proposedUnitNumber,
        targetFloorId: data.targetFloorId,
        targetCategoryId: data.targetCategoryId,
        proposedNetAreaSqft: data.proposedNetAreaSqft,
        proposedGrossAreaSqft: data.proposedGrossAreaSqft,
        proposedRatePerSqftPkr: data.proposedRatePerSqftPkr,
        proposedPriceAdjustmentPkr: data.proposedPriceAdjustmentPkr,
        proposedPriceAdjustmentReason: data.proposedPriceAdjustmentReason ?? null,
        reason: data.reason,
        proofStoragePath: data.proofStoragePath,
        proofMimeType: data.proofMimeType,
        proofFileName: data.proofFileName ?? null,
        sourceUnitsSnapshot: snapshots,
        requestedBy: session.user.id,
      })
      .returning();

    if (!createdReq) {
      throw new ValidationError("Failed to create merge request.");
    }

    await tx.insert(unitMergeSources).values(
      snapshots.map((s) => ({
        mergeRequestId: createdReq.id,
        sourceUnitId: s.id,
        unitCode: s.unitCode,
        unitNumber: s.unitNumber,
        floorName: s.floorName,
        categoryName: s.categoryName,
        netAreaSqft: s.netAreaSqft,
        grossAreaSqft: s.grossAreaSqft,
        ratePerSqftPkr: s.ratePerSqftPkr,
        computedPricePkr: s.computedPricePkr,
      })),
    );

    await tx.insert(auditLog).values({
      actorId: session.user.id,
      entity: "unit_merge",
      entityId: createdReq.id,
      action: "UNIT_MERGE_REQUEST",
      before: null,
      after: {
        proposedUnitCode: data.proposedUnitCode,
        sourceUnitCodes: snapshots.map((s) => s.unitCode),
        reason: data.reason,
      },
    });

    // If an ADMIN explicitly checks approveImmediately, execute right away
    if (data.approveImmediately && can(session.user.role, "units.merge_approve")) {
      const mergedUnit = await executeApprovedMergeInTx(tx, createdReq, session.user.id);
      return {
        requestId: createdReq.id,
        status: "APPROVED" as const,
        resultingUnitId: mergedUnit.id,
      };
    }

    return {
      requestId: createdReq.id,
      status: "PENDING" as const,
      resultingUnitId: null,
    };
  });

  revalidateMergePaths(
    result.resultingUnitId
      ? [...data.sourceUnitIds, result.resultingUnitId]
      : data.sourceUnitIds,
  );
  return result;
}

export async function approveUnitMerge(input: unknown) {
  const session = await requireSession();
  assertCan(session.user.role, "units.merge_approve");

  const parsed = approveMergeRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid approval data");
  }

  const { mergeRequestId, ...overrides } = parsed.data;

  const mergedUnit = await db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(unitMergeRequests)
      .where(eq(unitMergeRequests.id, mergeRequestId))
      .for("update");

    if (!request) {
      throw new NotFoundError("Merge request not found");
    }
    if (request.status !== "PENDING") {
      throw new ConflictError(`This merge request is already ${request.status}.`);
    }

    return executeApprovedMergeInTx(tx, request, session.user.id, overrides);
  });

  revalidateMergePaths([mergedUnit.id]);
  return { resultingUnitId: mergedUnit.id, unitCode: mergedUnit.unitCode };
}

export async function rejectUnitMerge(input: unknown) {
  const session = await requireSession();
  assertCan(session.user.role, "units.merge_approve");

  const parsed = rejectMergeRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Invalid rejection data",
    );
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(unitMergeRequests)
      .where(eq(unitMergeRequests.id, parsed.data.mergeRequestId))
      .for("update");

    if (!request) {
      throw new NotFoundError("Merge request not found");
    }
    if (request.status !== "PENDING") {
      throw new ConflictError(`This merge request is already ${request.status}.`);
    }

    await tx
      .update(unitMergeRequests)
      .set({
        status: "REJECTED",
        rejectionReason: parsed.data.rejectionReason,
        reviewedBy: session.user.id,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(unitMergeRequests.id, request.id));

    await tx.insert(auditLog).values({
      actorId: session.user.id,
      entity: "unit_merge",
      entityId: request.id,
      action: "UNIT_MERGE_REJECT",
      before: { status: "PENDING" },
      after: { status: "REJECTED", rejectionReason: parsed.data.rejectionReason },
    });
  });

  revalidateMergePaths();
  return { ok: true };
}
