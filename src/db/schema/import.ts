import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const importBatches = pgTable("import_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  originalFilePath: text("original_file_path").notNull(),
  rawRows: jsonb("raw_rows").$type<Record<string, unknown>[]>().notNull(),
  rowCount: integer("row_count").default(0).notNull(),
  createdCount: integer("created_count").default(0).notNull(),
  updatedCount: integer("updated_count").default(0).notNull(),
  skippedCount: integer("skipped_count").default(0).notNull(),
  warningCount: integer("warning_count").default(0).notNull(),
  errorCount: integer("error_count").default(0).notNull(),
  warnings: jsonb("warnings").$type<string[]>().default([]).notNull(),
  errors: jsonb("errors").$type<string[]>().default([]).notNull(),
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
