import "server-only";

import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { user } from "@/db/schema/auth";
import { units } from "@/db/schema/units";
import type { AuditAction } from "@/db/schema/enums";

export interface AuditLogRow {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  entity: string;
  entityId: string;
  entityLabel: string;
  unitCode: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: Date;
}

export type AuditLogFilter = {
  actorId?: string;
  entity?: string;
  action?: AuditAction;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

export interface AuditLogResult {
  rows: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const subjectUser = alias(user, "subject_user");

export async function listAuditLog(filter: AuditLogFilter = {}): Promise<AuditLogResult> {
  const conditions = [];
  if (filter.actorId) {
    conditions.push(eq(auditLog.actorId, filter.actorId));
  }
  if (filter.entity) {
    conditions.push(eq(auditLog.entity, filter.entity));
  }
  if (filter.action) {
    conditions.push(eq(auditLog.action, filter.action));
  }
  if (filter.from) {
    conditions.push(gte(auditLog.createdAt, filter.from));
  }
  if (filter.to) {
    conditions.push(lte(auditLog.createdAt, filter.to));
  }

  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.max(1, Math.min(200, filter.pageSize ?? 50));
  const offset = (page - 1) * pageSize;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[countRow], rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLog)
      .where(whereClause),
    db
      .select({
        id: auditLog.id,
        actorId: auditLog.actorId,
        actorName: user.name,
        action: auditLog.action,
        entity: auditLog.entity,
        entityId: auditLog.entityId,
        subjectName: subjectUser.name,
        before: auditLog.before,
        after: auditLog.after,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .leftJoin(user, eq(auditLog.actorId, user.id))
      .leftJoin(
        subjectUser,
        and(eq(auditLog.entity, "user"), eq(auditLog.entityId, subjectUser.id)),
      )
      .where(whereClause)
      .orderBy(desc(auditLog.createdAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.ceil(total / pageSize) || 1;

  const missingUnitIds = rows
    .filter(
      (r) =>
        r.entity === "unit" &&
        !(r.after as Record<string, unknown> | null)?.unitCode &&
        !(r.before as Record<string, unknown> | null)?.unitCode,
    )
    .map((r) => r.entityId);

  const unitRows =
    missingUnitIds.length > 0
      ? await db
          .select({ id: units.id, unitCode: units.unitCode })
          .from(units)
          .where(inArray(units.id, missingUnitIds))
      : [];
  const unitMap = new Map(unitRows.map((u) => [u.id, u.unitCode]));

  const mappedRows = rows.map((r) => {
    const after = r.after as Record<string, unknown> | null;
    const before = r.before as Record<string, unknown> | null;
    const unitCode =
      (typeof after?.unitCode === "string" ? after.unitCode : undefined) ??
      (typeof before?.unitCode === "string" ? before.unitCode : undefined) ??
      unitMap.get(r.entityId) ??
      null;
    const entityLabel =
      r.entity === "unit"
        ? (unitCode ?? r.entityId.slice(0, 8))
        : r.entity === "user"
          ? (r.subjectName ??
            (typeof after?.name === "string" ? after.name : null) ??
            (typeof before?.name === "string" ? before.name : null) ??
            r.entityId.slice(0, 8))
          : ((typeof r.after?.name === "string" ? r.after.name : null) ??
            (typeof r.before?.name === "string" ? r.before.name : null) ??
            r.entityId.slice(0, 8));
    return {
      id: r.id,
      actorId: r.actorId,
      actorName: r.actorName ?? "System",
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      entityLabel,
      unitCode,
      before: r.before as Record<string, unknown> | null,
      after: r.after as Record<string, unknown> | null,
      createdAt: r.createdAt,
    };
  });

  return {
    rows: mappedRows,
    total,
    page,
    pageSize,
    totalPages,
  };
}
