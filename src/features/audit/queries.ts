import "server-only";

import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
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
};

const subjectUser = alias(user, "subject_user");

export async function listAuditLog(filter: AuditLogFilter = {}): Promise<AuditLogRow[]> {
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

  const rows = await db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorName: user.name,
      action: auditLog.action,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      subjectName: subjectUser.name,
      unitCode: sql<
        string | null
      >`case when ${auditLog.entity} = 'unit' then coalesce(${units.unitCode}, (${auditLog.after}->>'unitCode'), (${auditLog.before}->>'unitCode')) else null end`,
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
    .leftJoin(
      units,
      sql`${auditLog.entity} = 'unit' and ${auditLog.entityId} = ${units.id}::text`,
    )
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(200);

  return rows.map((r) => {
    const unitCode = r.unitCode;
    const entityLabel =
      r.entity === "unit"
        ? (unitCode ?? r.entityId.slice(0, 8))
        : r.entity === "user"
          ? (r.subjectName ??
            (typeof r.after?.name === "string" ? r.after.name : null) ??
            (typeof r.before?.name === "string" ? r.before.name : null) ??
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
}
