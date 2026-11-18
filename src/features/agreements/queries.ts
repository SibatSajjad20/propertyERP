import "server-only";

import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import type { AgreementStatus } from "@/db/schema/enums";
import { blocks, categories, floors } from "@/db/schema/property";
import {
  agreements,
  bookings,
  clients,
  installments,
  nextOfKin,
  sales,
} from "@/db/schema/sales";
import { units } from "@/db/schema/units";
import {
  CLIENT_DOCUMENTS_BUCKET,
  SIGNED_READ_SECONDS,
} from "@/features/documents/constants";
import { effectivePricingArea, formatUnitDisplayCode } from "@/lib/area";
import { getSupabaseServer, isStorageConfigured } from "@/lib/supabase-server";

export interface AgreementListItem {
  id: string;
  agreementNo: string;
  status: AgreementStatus;
  bookingId: string | null;
  bookingNo: string | null;
  saleId: string | null;
  unitId: string;
  unitCode: string;
  unitDisplay: string;
  floorName: string;
  categoryName: string;
  clientId: string;
  clientName: string;
  clientCnic: string;
  clientPhone: string;
  sellerName: string;
  agreementDate: string;
  anticipatedCompletionDate: string;
  hasSignedCopy: boolean;
  signedFileName: string | null;
  createdAt: string;
}

export async function listAgreements(filters?: {
  status?: AgreementStatus | "ALL";
  q?: string;
}): Promise<AgreementListItem[]> {
  const conditions = [];
  if (filters?.status && filters.status !== "ALL") {
    conditions.push(eq(agreements.status, filters.status));
  }
  if (filters?.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(agreements.agreementNo, term),
        ilike(clients.fullName, term),
        ilike(clients.cnic, term),
        ilike(units.unitCode, term),
      ),
    );
  }

  const rows = await db
    .select({
      id: agreements.id,
      agreementNo: agreements.agreementNo,
      status: agreements.status,
      bookingId: agreements.bookingId,
      bookingNo: bookings.bookingNo,
      saleId: agreements.saleId,
      unitId: units.id,
      unitCode: units.unitCode,
      floorName: floors.name,
      categoryName: categories.name,
      clientId: clients.id,
      clientName: clients.fullName,
      clientCnic: clients.cnic,
      clientPhone: clients.phone,
      sellerName: agreements.sellerName,
      agreementDate: agreements.agreementDate,
      anticipatedCompletionDate: agreements.anticipatedCompletionDate,
      signedStoragePath: agreements.signedStoragePath,
      signedFileName: agreements.signedFileName,
      createdAt: agreements.createdAt,
    })
    .from(agreements)
    .innerJoin(units, eq(agreements.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(categories, eq(units.categoryId, categories.id))
    .innerJoin(clients, eq(agreements.clientId, clients.id))
    .leftJoin(bookings, eq(agreements.bookingId, bookings.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(agreements.createdAt));

  return rows.map((r) => ({
    id: r.id,
    agreementNo: r.agreementNo,
    status: r.status,
    bookingId: r.bookingId,
    bookingNo: r.bookingNo,
    saleId: r.saleId,
    unitId: r.unitId,
    unitCode: r.unitCode,
    unitDisplay: formatUnitDisplayCode(r.unitCode, r.categoryName),
    floorName: r.floorName,
    categoryName: r.categoryName,
    clientId: r.clientId,
    clientName: r.clientName,
    clientCnic: r.clientCnic,
    clientPhone: r.clientPhone,
    sellerName: r.sellerName,
    agreementDate: r.agreementDate.toISOString(),
    anticipatedCompletionDate: r.anticipatedCompletionDate,
    hasSignedCopy: Boolean(r.signedStoragePath),
    signedFileName: r.signedFileName,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getAgreementDetail(id: string) {
  const [row] = await db
    .select({
      agreement: agreements,
      unitCode: units.unitCode,
      unitNumber: units.unitNumber,
      netAreaSqft: units.netAreaSqft,
      grossAreaSqft: units.grossAreaSqft,
      floorName: floors.name,
      blockName: blocks.name,
      categoryName: categories.name,
      clientName: clients.fullName,
      clientRelationPrefix: clients.relationPrefix,
      clientRelationName: clients.relationName,
      clientCnic: clients.cnic,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      clientAddress: clients.homeAddress,
      bookingNo: bookings.bookingNo,
      bookingNetPrice: bookings.netPrice,
      bookingDownPayment: bookings.downPayment,
      bookingPossessionAmount: bookings.possessionAmount,
      bookingBalloonTotalAmount: bookings.balloonTotalAmount,
      bookingTokenAdjusted: bookings.tokenAdjustedAmount,
      bookingPlan: bookings.plan,
      salePrice: sales.salePrice,
      saleApplicationFormNo: sales.applicationFormNo,
      createdByName: user.name,
    })
    .from(agreements)
    .innerJoin(units, eq(agreements.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .innerJoin(categories, eq(units.categoryId, categories.id))
    .innerJoin(clients, eq(agreements.clientId, clients.id))
    .leftJoin(bookings, eq(agreements.bookingId, bookings.id))
    .leftJoin(sales, eq(agreements.saleId, sales.id))
    .leftJoin(user, eq(agreements.createdBy, user.id))
    .where(eq(agreements.id, id))
    .limit(1);

  if (!row) return null;

  const [[kin], scheduleRows] = await Promise.all([
    db
      .select()
      .from(nextOfKin)
      .where(eq(nextOfKin.clientId, row.agreement.clientId))
      .limit(1),
    row.agreement.bookingId
      ? db
          .select()
          .from(installments)
          .where(eq(installments.bookingId, row.agreement.bookingId))
          .orderBy(asc(installments.seq))
      : Promise.resolve([]),
  ]);

  let signedDownloadUrl: string | null = null;
  if (row.agreement.signedStoragePath && isStorageConfigured()) {
    try {
      const supabase = getSupabaseServer();
      const { data } = await supabase.storage
        .from(CLIENT_DOCUMENTS_BUCKET)
        .createSignedUrl(row.agreement.signedStoragePath, SIGNED_READ_SECONDS);
      signedDownloadUrl = data?.signedUrl ?? null;
    } catch {
      signedDownloadUrl = null;
    }
  }

  return {
    agreement: {
      ...row.agreement,
      agreementDate: row.agreement.agreementDate.toISOString(),
      signedUploadedAt: row.agreement.signedUploadedAt
        ? row.agreement.signedUploadedAt.toISOString()
        : null,
      createdAt: row.agreement.createdAt.toISOString(),
      updatedAt: row.agreement.updatedAt.toISOString(),
    },
    unit: {
      id: row.agreement.unitId,
      unitCode: row.unitCode,
      unitDisplay: formatUnitDisplayCode(row.unitCode, row.categoryName),
      floorName: row.floorName,
      blockName: row.blockName,
      categoryName: row.categoryName,
      grossAreaSqft: effectivePricingArea(row.grossAreaSqft, row.netAreaSqft),
    },
    buyer: {
      id: row.agreement.clientId,
      fullName: row.clientName,
      relationPrefix: row.clientRelationPrefix,
      relationName: row.clientRelationName,
      cnic: row.clientCnic,
      phone: row.clientPhone,
      email: row.clientEmail ?? "",
      address: row.clientAddress,
      nationality: row.agreement.buyerNationality,
    },
    nominee: kin
      ? {
          name: kin.name,
          relationPrefix: kin.relationPrefix,
          relationName: kin.relationName,
          relation: kin.relation,
          cnic: kin.cnic ?? "",
          phone: kin.phone,
          address: kin.address ?? row.clientAddress,
          nationality: row.agreement.nomineeNationality,
        }
      : null,
    financials: {
      bookingNo: row.bookingNo,
      saleApplicationFormNo: row.saleApplicationFormNo,
      totalPricePkr: row.bookingNetPrice ?? row.salePrice ?? "0.00",
      bookingAmountPkr: row.bookingDownPayment ?? row.salePrice ?? "0.00",
      possessionAmountPkr: row.bookingPossessionAmount ?? "0.00",
      balloonTotalAmountPkr: row.bookingBalloonTotalAmount ?? "0.00",
      tokenAdjustedAmountPkr: row.bookingTokenAdjusted ?? "0.00",
      plan: row.bookingPlan ?? "FULL",
    },
    scheduleRows: scheduleRows.map((i) => ({
      seq: i.seq,
      type: i.type,
      label: i.label || `Installment #${i.seq}`,
      dueDate: i.dueDate.toISOString(),
      amountPkr: i.amount,
      status: i.status,
    })),
    createdByName: row.createdByName,
    signedDownloadUrl,
  };
}

export interface AgreementCandidate {
  kind: "BOOKING" | "SALE";
  id: string;
  refNo: string;
  unitDisplay: string;
  floorName: string;
  clientName: string;
  clientCnic: string;
  totalPricePkr: string;
}

export async function listAgreementCandidates(): Promise<AgreementCandidate[]> {
  const [bookingRows, saleRows] = await Promise.all([
    db
      .select({
        id: bookings.id,
        refNo: bookings.bookingNo,
        unitCode: units.unitCode,
        categoryName: categories.name,
        floorName: floors.name,
        clientName: clients.fullName,
        clientCnic: clients.cnic,
        totalPricePkr: bookings.netPrice,
      })
      .from(bookings)
      .innerJoin(units, eq(bookings.unitId, units.id))
      .innerJoin(floors, eq(units.floorId, floors.id))
      .innerJoin(categories, eq(units.categoryId, categories.id))
      .innerJoin(clients, eq(bookings.clientId, clients.id))
      .where(or(eq(bookings.status, "ACTIVE"), eq(bookings.status, "COMPLETED")))
      .orderBy(desc(bookings.createdAt))
      .limit(200),
    db
      .select({
        id: sales.id,
        refNo: sales.applicationFormNo,
        unitCode: units.unitCode,
        categoryName: categories.name,
        floorName: floors.name,
        clientName: clients.fullName,
        clientCnic: clients.cnic,
        totalPricePkr: sales.salePrice,
        bookingId: sales.bookingId,
      })
      .from(sales)
      .innerJoin(units, eq(sales.unitId, units.id))
      .innerJoin(floors, eq(units.floorId, floors.id))
      .innerJoin(categories, eq(units.categoryId, categories.id))
      .innerJoin(clients, eq(sales.clientId, clients.id))
      .where(eq(sales.status, "ACTIVE"))
      .orderBy(desc(sales.soldAt))
      .limit(200),
  ]);

  const candidates: AgreementCandidate[] = [];
  for (const b of bookingRows) {
    candidates.push({
      kind: "BOOKING",
      id: b.id,
      refNo: b.refNo,
      unitDisplay: formatUnitDisplayCode(b.unitCode, b.categoryName),
      floorName: b.floorName,
      clientName: b.clientName,
      clientCnic: b.clientCnic,
      totalPricePkr: b.totalPricePkr,
    });
  }
  for (const s of saleRows) {
    if (s.bookingId) continue;
    candidates.push({
      kind: "SALE",
      id: s.id,
      refNo: s.refNo,
      unitDisplay: formatUnitDisplayCode(s.unitCode, s.categoryName),
      floorName: s.floorName,
      clientName: s.clientName,
      clientCnic: s.clientCnic,
      totalPricePkr: s.totalPricePkr,
    });
  }
  return candidates;
}
