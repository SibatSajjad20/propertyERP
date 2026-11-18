import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import type { MergeRequestStatus } from "@/db/schema/enums";
import { categories, floors } from "@/db/schema/property";
import {
  unitMergeRequests,
  unitMergeSources,
  units,
  type MergeSourceSnapshot,
} from "@/db/schema/units";
import {
  CLIENT_DOCUMENTS_BUCKET,
  SIGNED_READ_SECONDS,
} from "@/features/documents/constants";
import { getSupabaseServer, isStorageConfigured } from "@/lib/supabase-server";

export interface MergeRequestListItem {
  id: string;
  propertyId: string;
  status: MergeRequestStatus;
  proposedUnitCode: string;
  proposedUnitNumber: string;
  targetFloorId: string;
  targetFloorName: string;
  targetCategoryId: string;
  targetCategoryName: string;
  proposedNetAreaSqft: string;
  proposedGrossAreaSqft: string;
  proposedRatePerSqftPkr: string;
  proposedPriceAdjustmentPkr: string;
  proposedPriceAdjustmentReason: string | null;
  reason: string;
  proofStoragePath: string;
  proofMimeType: string;
  proofFileName: string | null;
  proofUrl: string | null;
  sourceUnitsSnapshot: MergeSourceSnapshot[];
  resultingUnitId: string | null;
  requestedBy: string;
  requestedByName: string | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface UnitMergeInfo {
  mergeRequestId: string;
  reason: string;
  proofStoragePath: string;
  proofMimeType: string;
  proofFileName: string | null;
  proofUrl: string | null;
  requestedByName: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  sources: Array<{
    id: string;
    sourceUnitId: string;
    unitCode: string;
    unitNumber: string;
    floorName: string;
    categoryName: string;
    netAreaSqft: string;
    grossAreaSqft: string | null;
    ratePerSqftPkr: string;
    computedPricePkr: string;
  }>;
}

async function signProofPaths(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0 || !isStorageConfigured()) return map;
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase.storage
      .from(CLIENT_DOCUMENTS_BUCKET)
      .createSignedUrls(unique, SIGNED_READ_SECONDS);
    if (data) {
      unique.forEach((p, idx) => {
        const signed = data[idx]?.signedUrl;
        if (signed) map.set(p, signed);
      });
    }
  } catch {
    // Graceful fallback if storage unavailable
  }
  return map;
}

export async function getPendingMergeRequestCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(unitMergeRequests)
    .where(eq(unitMergeRequests.status, "PENDING"));
  return Number(row?.count ?? 0);
}

export async function listMergeRequests(
  statusFilter?: MergeRequestStatus | "ALL",
): Promise<MergeRequestListItem[]> {
  const where =
    statusFilter && statusFilter !== "ALL"
      ? eq(unitMergeRequests.status, statusFilter)
      : undefined;

  const rows = await db
    .select({
      id: unitMergeRequests.id,
      propertyId: unitMergeRequests.propertyId,
      status: unitMergeRequests.status,
      proposedUnitCode: unitMergeRequests.proposedUnitCode,
      proposedUnitNumber: unitMergeRequests.proposedUnitNumber,
      targetFloorId: unitMergeRequests.targetFloorId,
      targetFloorName: floors.name,
      targetCategoryId: unitMergeRequests.targetCategoryId,
      targetCategoryName: categories.name,
      proposedNetAreaSqft: unitMergeRequests.proposedNetAreaSqft,
      proposedGrossAreaSqft: unitMergeRequests.proposedGrossAreaSqft,
      proposedRatePerSqftPkr: unitMergeRequests.proposedRatePerSqftPkr,
      proposedPriceAdjustmentPkr: unitMergeRequests.proposedPriceAdjustmentPkr,
      proposedPriceAdjustmentReason: unitMergeRequests.proposedPriceAdjustmentReason,
      reason: unitMergeRequests.reason,
      proofStoragePath: unitMergeRequests.proofStoragePath,
      proofMimeType: unitMergeRequests.proofMimeType,
      proofFileName: unitMergeRequests.proofFileName,
      sourceUnitsSnapshot: unitMergeRequests.sourceUnitsSnapshot,
      resultingUnitId: unitMergeRequests.resultingUnitId,
      requestedBy: unitMergeRequests.requestedBy,
      reviewedBy: unitMergeRequests.reviewedBy,
      reviewedAt: unitMergeRequests.reviewedAt,
      rejectionReason: unitMergeRequests.rejectionReason,
      createdAt: unitMergeRequests.createdAt,
    })
    .from(unitMergeRequests)
    .innerJoin(floors, eq(floors.id, unitMergeRequests.targetFloorId))
    .innerJoin(categories, eq(categories.id, unitMergeRequests.targetCategoryId))
    .where(where)
    .orderBy(desc(unitMergeRequests.createdAt));

  const userIds = [
    ...new Set(
      rows
        .flatMap((r) => [r.requestedBy, r.reviewedBy])
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  const usersList =
    userIds.length > 0
      ? await db.select({ id: user.id, name: user.name }).from(user)
      : [];
  const userNameMap = new Map(usersList.map((u) => [u.id, u.name]));

  const signedUrls = await signProofPaths(rows.map((r) => r.proofStoragePath));

  return rows.map((r) => ({
    ...r,
    proofUrl: signedUrls.get(r.proofStoragePath) ?? null,
    requestedByName: userNameMap.get(r.requestedBy) ?? null,
    reviewedByName: r.reviewedBy ? (userNameMap.get(r.reviewedBy) ?? null) : null,
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getMergeDetailsForUnit(
  unitId: string,
): Promise<UnitMergeInfo | null> {
  const [req] = await db
    .select({
      id: unitMergeRequests.id,
      reason: unitMergeRequests.reason,
      proofStoragePath: unitMergeRequests.proofStoragePath,
      proofMimeType: unitMergeRequests.proofMimeType,
      proofFileName: unitMergeRequests.proofFileName,
      requestedBy: unitMergeRequests.requestedBy,
      reviewedBy: unitMergeRequests.reviewedBy,
      reviewedAt: unitMergeRequests.reviewedAt,
    })
    .from(unitMergeRequests)
    .where(
      and(
        eq(unitMergeRequests.resultingUnitId, unitId),
        eq(unitMergeRequests.status, "APPROVED"),
      ),
    )
    .limit(1);

  if (!req) return null;

  const [sources, usersList, signedUrls] = await Promise.all([
    db
      .select({
        id: unitMergeSources.id,
        sourceUnitId: unitMergeSources.sourceUnitId,
        unitCode: unitMergeSources.unitCode,
        unitNumber: unitMergeSources.unitNumber,
        floorName: unitMergeSources.floorName,
        categoryName: unitMergeSources.categoryName,
        netAreaSqft: unitMergeSources.netAreaSqft,
        grossAreaSqft: unitMergeSources.grossAreaSqft,
        ratePerSqftPkr: unitMergeSources.ratePerSqftPkr,
        computedPricePkr: unitMergeSources.computedPricePkr,
      })
      .from(unitMergeSources)
      .where(eq(unitMergeSources.mergeRequestId, req.id))
      .orderBy(asc(unitMergeSources.unitCode)),
    db.select({ id: user.id, name: user.name }).from(user),
    signProofPaths([req.proofStoragePath]),
  ]);

  const nameMap = new Map(usersList.map((u) => [u.id, u.name]));

  return {
    mergeRequestId: req.id,
    reason: req.reason,
    proofStoragePath: req.proofStoragePath,
    proofMimeType: req.proofMimeType,
    proofFileName: req.proofFileName,
    proofUrl: signedUrls.get(req.proofStoragePath) ?? null,
    requestedByName: nameMap.get(req.requestedBy) ?? null,
    approvedByName: req.reviewedBy ? (nameMap.get(req.reviewedBy) ?? null) : null,
    approvedAt: req.reviewedAt ? req.reviewedAt.toISOString() : null,
    sources,
  };
}

export async function listAvailableUnitsForMerge() {
  return db
    .select({
      id: units.id,
      propertyId: units.propertyId,
      unitCode: units.unitCode,
      unitNumber: units.unitNumber,
      floorId: units.floorId,
      floorName: floors.name,
      floorLevel: floors.level,
      categoryId: units.categoryId,
      categoryName: categories.name,
      netAreaSqft: units.netAreaSqft,
      grossAreaSqft: units.grossAreaSqft,
      ratePerSqftPkr: units.ratePerSqftPkr,
      priceAdjustmentPkr: units.priceAdjustmentPkr,
      computedPricePkr: sql<string>`round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0)::numeric(14, 2)`,
    })
    .from(units)
    .innerJoin(floors, eq(floors.id, units.floorId))
    .innerJoin(categories, eq(categories.id, units.categoryId))
    .where(and(eq(units.status, "AVAILABLE"), isNull(units.archivedAt)))
    .orderBy(asc(floors.level), asc(units.unitCode));
}
