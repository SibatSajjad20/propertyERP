import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { auditActionEnum } from "./enums";

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  action: auditActionEnum("action").notNull(),
  before: jsonb("before").$type<Record<string, unknown> | null>(),
  after: jsonb("after").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
