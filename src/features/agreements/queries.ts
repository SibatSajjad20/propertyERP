import "server-only";

import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db, sql, withTransientDbRetry } from "@/db";
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
  return withTransientDbRetry(async () => {
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
  });
}

export async function getAgreementDetail(id: string) {
  return withTransientDbRetry(async () => {
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

    const [kin] = await db
      .select()
      .from(nextOfKin)
      .where(eq(nextOfKin.clientId, row.agreement.clientId))
      .limit(1);

    const scheduleRows = row.agreement.bookingId
      ? await db
          .select()
          .from(installments)
          .where(eq(installments.bookingId, row.agreement.bookingId))
          .orderBy(asc(installments.seq))
      : [];

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
  });
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
  return withTransientDbRetry(async () => {
    const rows = await sql<
      Array<{
        kind: "BOOKING" | "SALE";
        id: string;
        refNo: string;
        unitCode: string;
        categoryName: string;
        floorName: string;
        clientName: string;
        clientCnic: string;
        totalPricePkr: string;
      }>
    >`
      (
        select 
          'BOOKING' as kind,
          b.id,
          b.booking_no as "refNo",
          u.unit_code as "unitCode",
          cat.name as "categoryName",
          f.name as "floorName",
          c.full_name as "clientName",
          c.cnic as "clientCnic",
          b.net_price::text as "totalPricePkr"
        from bookings b
        inner join units u on b.unit_id = u.id
        inner join floors f on u.floor_id = f.id
        inner join categories cat on u.category_id = cat.id
        inner join clients c on b.client_id = c.id
        where b.status in ('ACTIVE', 'COMPLETED')
        order by b.created_at desc
        limit 200
      )
      union all
      (
        select 
          'SALE' as kind,
          s.id,
          s.application_form_no as "refNo",
          u.unit_code as "unitCode",
          cat.name as "categoryName",
          f.name as "floorName",
          c.full_name as "clientName",
          c.cnic as "clientCnic",
          s.sale_price::text as "totalPricePkr"
        from sales s
        inner join units u on s.unit_id = u.id
        inner join floors f on u.floor_id = f.id
        inner join categories cat on u.category_id = cat.id
        inner join clients c on s.client_id = c.id
        where s.status = 'ACTIVE' and s.booking_id is null
        order by s.sold_at desc
        limit 200
      )
    `;

    return rows.map((r) => ({
      kind: r.kind,
      id: r.id,
      refNo: r.refNo,
      unitDisplay: formatUnitDisplayCode(r.unitCode, r.categoryName),
      floorName: r.floorName,
      clientName: r.clientName,
      clientCnic: r.clientCnic,
      totalPricePkr: r.totalPricePkr,
    }));
  });
}
