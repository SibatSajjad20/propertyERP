import "server-only";

import { and, asc, desc, eq, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { blocks, floors } from "@/db/schema/property";
import { bookings, clients, installments, nextOfKin, payments } from "@/db/schema/sales";
import { units } from "@/db/schema/units";
import { formatDecimal, parseDecimal } from "@/lib/money";

export interface DueThisWeekRow {
  installmentId: string;
  bookingId: string;
  bookingNo: string;
  seq: number;
  dueDate: Date;
  amount: string;
  paidAmount: string;
  balance: string;
  status: string;
  unitCode: string;
  clientName: string;
  clientCnic: string;
  clientPhone: string;
  isOverdue: boolean;
}

export interface DueThisWeekSummary {
  dueThisWeekCount: number;
  dueThisWeekPkr: string;
  overdueCount: number;
  overduePkr: string;
  rows: DueThisWeekRow[];
}

export async function getDueThisWeekInstallments(): Promise<DueThisWeekSummary> {
  const now = new Date();
  // Start of today, end of 7 days from now
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  );
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Fetch unpaid installments on active bookings due on or before endOfWeek
  const rows = await db
    .select({
      installmentId: installments.id,
      bookingId: bookings.id,
      bookingNo: bookings.bookingNo,
      seq: installments.seq,
      dueDate: installments.dueDate,
      amount: installments.amount,
      paidAmount: installments.paidAmount,
      status: installments.status,
      unitCode: units.unitCode,
      clientName: clients.fullName,
      clientCnic: clients.cnic,
      clientPhone: clients.phone,
    })
    .from(installments)
    .innerJoin(bookings, eq(installments.bookingId, bookings.id))
    .innerJoin(units, eq(bookings.unitId, units.id))
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(
      and(
        eq(bookings.status, "ACTIVE"),
        inArray(installments.status, ["PENDING", "PARTIAL", "OVERDUE"]),
        sql`${installments.paidAmount} < ${installments.amount}`,
        lte(installments.dueDate, endOfWeek),
      ),
    )
    .orderBy(asc(installments.dueDate), asc(installments.seq));

  let dueThisWeekPaisa = 0n;
  let dueThisWeekCount = 0;
  let overduePaisa = 0n;
  let overdueCount = 0;

  const formattedRows: DueThisWeekRow[] = [];

  for (const r of rows) {
    const amtPaisa = parseDecimal(r.amount);
    const paidPaisa = parseDecimal(r.paidAmount);
    const balPaisa = amtPaisa - paidPaisa;
    const isOverdue = r.dueDate < now;

    if (isOverdue) {
      overduePaisa += balPaisa;
      overdueCount++;
    } else {
      dueThisWeekPaisa += balPaisa;
      dueThisWeekCount++;
    }

    formattedRows.push({
      ...r,
      balance: formatDecimal(balPaisa),
      isOverdue,
    });
  }

  return {
    dueThisWeekCount,
    dueThisWeekPkr: formatDecimal(dueThisWeekPaisa),
    overdueCount,
    overduePkr: formatDecimal(overduePaisa),
    rows: formattedRows,
  };
}

export interface ClientSearchResult {
  id: string;
  fullName: string;
  cnic: string;
  phone: string;
  bookingCount: number;
  bookings: Array<{
    id: string;
    bookingNo: string;
    unitCode: string;
    status: string;
  }>;
}

export async function searchInstallmentsClients(
  q?: string,
): Promise<ClientSearchResult[]> {
  const trimmed = q?.trim() || "";
  if (!trimmed) {
    return [];
  }

  const term = `%${trimmed}%`;

  // Search clients directly or clients with matching booking/unit
  const clientRows = await db
    .select({
      id: clients.id,
      fullName: clients.fullName,
      cnic: clients.cnic,
      phone: clients.phone,
      bookingId: bookings.id,
      bookingNo: bookings.bookingNo,
      bookingStatus: bookings.status,
      unitCode: units.unitCode,
    })
    .from(clients)
    .leftJoin(bookings, eq(bookings.clientId, clients.id))
    .leftJoin(units, eq(bookings.unitId, units.id))
    .where(
      or(
        ilike(clients.fullName, term),
        ilike(clients.cnic, term),
        ilike(clients.phone, term),
        ilike(bookings.bookingNo, term),
        ilike(units.unitCode, term),
      ),
    )
    .limit(50);

  const clientMap = new Map<string, ClientSearchResult>();

  for (const r of clientRows) {
    let client = clientMap.get(r.id);
    if (!client) {
      client = {
        id: r.id,
        fullName: r.fullName,
        cnic: r.cnic,
        phone: r.phone,
        bookingCount: 0,
        bookings: [],
      };
      clientMap.set(r.id, client);
    }

    if (r.bookingId && !client.bookings.some((b) => b.id === r.bookingId)) {
      client.bookings.push({
        id: r.bookingId,
        bookingNo: r.bookingNo ?? "",
        unitCode: r.unitCode ?? "",
        status: r.bookingStatus ?? "",
      });
      client.bookingCount = client.bookings.length;
    }
  }

  return Array.from(clientMap.values());
}

export interface BookingScheduleDetail {
  id: string;
  bookingNo: string;
  status: string;
  plan: string;
  netPrice: string;
  downPayment: string;
  paidTotal: string;
  balance: string;
  paidPercent: number;
  startDate: Date;
  nextDueDate: Date | null;
  overdueAmount: string;
  unit: {
    id: string;
    unitCode: string;
    floorName: string;
    blockName: string;
    status: string;
    version: number;
  };
  schedule: Array<{
    id: string;
    seq: number;
    dueDate: Date;
    amount: string;
    paidAmount: string;
    balance: string;
    status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
    paidAt: Date | null;
    receiptNos: string | null;
  }>;
  payments: Array<{
    id: string;
    receiptNo: string;
    amount: string;
    method: string;
    chequeNo: string | null;
    bank: string | null;
    paidAt: Date;
    notes: string | null;
    isVoided: boolean;
    voidedAt: Date | null;
    voidedReason: string | null;
    receiverName: string | null;
  }>;
}

export interface ClientProfileWithBookings {
  client: {
    id: string;
    fullName: string;
    cnic: string;
    phone: string;
    email: string | null;
    homeAddress: string;
    postalAddress: string;
  };
  nextOfKin: {
    name: string;
    relation: string;
    cnic: string | null;
    phone: string;
    address: string | null;
  } | null;
  bookings: BookingScheduleDetail[];
}

export async function getClientProfileWithBookings(
  clientId: string,
): Promise<ClientProfileWithBookings | null> {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) {
    return null;
  }

  const [kin] = await db
    .select()
    .from(nextOfKin)
    .where(eq(nextOfKin.clientId, client.id))
    .limit(1);

  // Fetch all bookings for this client
  const bookingRows = await db
    .select({
      id: bookings.id,
      bookingNo: bookings.bookingNo,
      status: bookings.status,
      plan: bookings.plan,
      netPrice: bookings.netPrice,
      downPayment: bookings.downPayment,
      paidTotal: bookings.paidTotal,
      startDate: bookings.startDate,
      unitId: units.id,
      unitCode: units.unitCode,
      unitVersion: units.version,
      unitStatus: units.status,
      floorName: floors.name,
      blockName: blocks.name,
    })
    .from(bookings)
    .innerJoin(units, eq(bookings.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .where(eq(bookings.clientId, client.id))
    .orderBy(desc(bookings.createdAt));

  const now = new Date();
  const detailedBookings: BookingScheduleDetail[] = [];

  for (const b of bookingRows) {
    // Fetch installments
    const instRows = await db
      .select()
      .from(installments)
      .where(eq(installments.bookingId, b.id))
      .orderBy(asc(installments.seq));

    // Fetch payments
    const paymentRows = await db
      .select({
        id: payments.id,
        receiptNo: payments.receiptNo,
        amount: payments.amount,
        method: payments.method,
        chequeNo: payments.chequeNo,
        bank: payments.bank,
        paidAt: payments.paidAt,
        notes: payments.notes,
        isVoided: payments.isVoided,
        voidedAt: payments.voidedAt,
        voidedReason: payments.voidedReason,
        receiverName: user.name,
      })
      .from(payments)
      .leftJoin(user, eq(payments.receivedBy, user.id))
      .where(eq(payments.bookingId, b.id))
      .orderBy(asc(payments.paidAt), asc(payments.createdAt));

    let nextDueDate: Date | null = null;
    let overduePaisa = 0n;

    const schedule = instRows.map((inst) => {
      const amtPaisa = parseDecimal(inst.amount);
      const paidPaisa = parseDecimal(inst.paidAmount);
      const balPaisa = amtPaisa - paidPaisa;

      if (balPaisa > 0n) {
        if (!nextDueDate) {
          nextDueDate = inst.dueDate;
        }
        if (inst.dueDate < now) {
          overduePaisa += balPaisa;
        }
      }

      return {
        id: inst.id,
        seq: inst.seq,
        dueDate: inst.dueDate,
        amount: inst.amount,
        paidAmount: inst.paidAmount,
        balance: formatDecimal(balPaisa),
        status: inst.status,
        paidAt: inst.paidAt,
        receiptNos: inst.receiptNos,
      };
    });

    const netPaisa = parseDecimal(b.netPrice);
    const paidPaisa = parseDecimal(b.paidTotal);
    const balPaisa = netPaisa > paidPaisa ? netPaisa - paidPaisa : 0n;
    const paidPercent =
      netPaisa > 0n
        ? Math.min(100, Math.round(Number((paidPaisa * 10_000n) / netPaisa) / 100))
        : 0;

    detailedBookings.push({
      id: b.id,
      bookingNo: b.bookingNo,
      status: b.status,
      plan: b.plan,
      netPrice: b.netPrice,
      downPayment: b.downPayment,
      paidTotal: b.paidTotal,
      balance: formatDecimal(balPaisa),
      paidPercent,
      startDate: b.startDate,
      nextDueDate,
      overdueAmount: formatDecimal(overduePaisa),
      unit: {
        id: b.unitId,
        unitCode: b.unitCode,
        floorName: b.floorName,
        blockName: b.blockName,
        status: b.unitStatus,
        version: b.unitVersion,
      },
      schedule,
      payments: paymentRows,
    });
  }

  return {
    client: {
      id: client.id,
      fullName: client.fullName,
      cnic: client.cnic,
      phone: client.phone,
      email: client.email,
      homeAddress: client.homeAddress,
      postalAddress: client.postalAddress,
    },
    nextOfKin: kin
      ? {
          name: kin.name,
          relation: kin.relation,
          cnic: kin.cnic,
          phone: kin.phone,
          address: kin.address,
        }
      : null,
    bookings: detailedBookings,
  };
}
