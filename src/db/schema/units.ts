import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  pgView,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { mergeRequestStatusEnum, unitStatusEnum } from "./enums";
import { categories, floors, properties } from "./property";

export const units = pgTable(
  "units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "restrict" }),
    unitCode: text("unit_code").notNull(),
    unitNumber: text("unit_number").notNull(),
    floorId: uuid("floor_id")
      .notNull()
      .references(() => floors.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    netAreaSqft: numeric("net_area_sqft", { precision: 10, scale: 2 }).notNull(),
    grossAreaSqft: numeric("gross_area_sqft", { precision: 10, scale: 2 }),
    ratePerSqftPkr: numeric("rate_per_sqft_pkr", { precision: 14, scale: 2 }).notNull(),
    priceAdjustmentPkr: numeric("price_adjustment_pkr", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    priceAdjustmentReason: text("price_adjustment_reason"),
    soldPricePkr: numeric("sold_price_pkr", { precision: 14, scale: 2 }),
    soldAt: timestamp("sold_at"),
    soldBy: text("sold_by").references(() => user.id, { onDelete: "set null" }),
    status: unitStatusEnum("status").default("AVAILABLE").notNull(),
    isSellable: boolean("is_sellable").default(true).notNull(),
    ownershipGroup: text("ownership_group"),
    subOwner: text("sub_owner"),
    bookingRef: text("booking_ref"),
    notes: text("notes"),
    isMergedUnit: boolean("is_merged_unit").default(false).notNull(),
    mergedIntoUnitId: uuid("merged_into_unit_id"),
    version: integer("version").default(1).notNull(),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("units_property_unit_code_idx").on(table.propertyId, table.unitCode),
    index("units_property_archived_code_idx").on(
      table.propertyId,
      table.archivedAt,
      table.unitCode,
    ),
    index("units_floor_id_idx").on(table.floorId),
    index("units_property_id_idx").on(table.propertyId),
    index("units_category_id_idx").on(table.categoryId),
    index("units_status_idx").on(table.status),
    index("units_archived_at_idx").on(table.archivedAt),
    index("units_updated_at_idx").on(table.updatedAt),
    index("units_merged_into_unit_id_idx").on(table.mergedIntoUnitId),
    index("units_floor_status_idx").on(table.floorId, table.status),
    index("units_floor_status_archived_idx").on(
      table.floorId,
      table.status,
      table.archivedAt,
    ),
  ],
);

export const unitPricing = pgView("unit_pricing", {
  unitId: uuid("unit_id").notNull(),
  computedPricePkr: numeric("computed_price_pkr", { precision: 14, scale: 2 }).notNull(),
}).as(
  sql`select "id" as "unit_id", round(("rate_per_sqft_pkr" * coalesce("gross_area_sqft", "net_area_sqft")) + coalesce("price_adjustment_pkr", 0), 0)::numeric(14, 2) as "computed_price_pkr" from "units"`,
);

export const unitStatusHistory = pgTable(
  "unit_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    fromStatus: unitStatusEnum("from_status").notNull(),
    toStatus: unitStatusEnum("to_status").notNull(),
    reason: text("reason"),
    bookingRef: text("booking_ref"),
    soldPricePkr: numeric("sold_price_pkr", { precision: 14, scale: 2 }),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("unit_status_history_unit_id_created_at_idx").on(table.unitId, table.createdAt),
    index("unit_status_history_to_status_created_at_idx").on(
      table.toStatus,
      table.createdAt,
    ),
  ],
);

export const rateHistory = pgTable(
  "rate_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    oldRatePerSqftPkr: numeric("old_rate_per_sqft_pkr", {
      precision: 14,
      scale: 2,
    }).notNull(),
    ratePerSqftPkr: numeric("rate_per_sqft_pkr", { precision: 14, scale: 2 }).notNull(),
    reason: text("reason").notNull(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("rate_history_unit_id_idx").on(table.unitId)],
);

export type MergeSourceSnapshot = {
  id: string;
  unitCode: string;
  unitNumber: string;
  floorId: string;
  floorName: string;
  categoryId: string;
  categoryName: string;
  netAreaSqft: string;
  grossAreaSqft: string | null;
  ratePerSqftPkr: string;
  priceAdjustmentPkr: string;
  computedPricePkr: string;
};

export const unitMergeRequests = pgTable(
  "unit_merge_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "restrict" }),
    status: mergeRequestStatusEnum("status").default("PENDING").notNull(),
    proposedUnitCode: text("proposed_unit_code").notNull(),
    proposedUnitNumber: text("proposed_unit_number").notNull(),
    targetFloorId: uuid("target_floor_id")
      .notNull()
      .references(() => floors.id, { onDelete: "restrict" }),
    targetCategoryId: uuid("target_category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    proposedNetAreaSqft: numeric("proposed_net_area_sqft", {
      precision: 10,
      scale: 2,
    }).notNull(),
    proposedGrossAreaSqft: numeric("proposed_gross_area_sqft", {
      precision: 10,
      scale: 2,
    }).notNull(),
    proposedRatePerSqftPkr: numeric("proposed_rate_per_sqft_pkr", {
      precision: 14,
      scale: 2,
    }).notNull(),
    proposedPriceAdjustmentPkr: numeric("proposed_price_adjustment_pkr", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),
    proposedPriceAdjustmentReason: text("proposed_price_adjustment_reason"),
    reason: text("reason").notNull(),
    proofStoragePath: text("proof_storage_path").notNull(),
    proofMimeType: text("proof_mime_type").notNull(),
    proofFileName: text("proof_file_name"),
    sourceUnitsSnapshot: jsonb("source_units_snapshot")
      .$type<MergeSourceSnapshot[]>()
      .notNull(),
    resultingUnitId: uuid("resulting_unit_id").references(() => units.id, {
      onDelete: "set null",
    }),
    requestedBy: text("requested_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("unit_merge_requests_status_idx").on(table.status),
    index("unit_merge_requests_resulting_unit_idx").on(table.resultingUnitId),
    index("unit_merge_requests_created_at_idx").on(table.createdAt),
  ],
);

export const unitMergeSources = pgTable(
  "unit_merge_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mergeRequestId: uuid("merge_request_id")
      .notNull()
      .references(() => unitMergeRequests.id, { onDelete: "cascade" }),
    sourceUnitId: uuid("source_unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "restrict" }),
    mergedUnitId: uuid("merged_unit_id").references(() => units.id, {
      onDelete: "set null",
    }),
    unitCode: text("unit_code").notNull(),
    unitNumber: text("unit_number").notNull(),
    floorName: text("floor_name").notNull(),
    categoryName: text("category_name").notNull(),
    netAreaSqft: numeric("net_area_sqft", { precision: 10, scale: 2 }).notNull(),
    grossAreaSqft: numeric("gross_area_sqft", { precision: 10, scale: 2 }),
    ratePerSqftPkr: numeric("rate_per_sqft_pkr", { precision: 14, scale: 2 }).notNull(),
    computedPricePkr: numeric("computed_price_pkr", {
      precision: 14,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("unit_merge_sources_merge_request_idx").on(table.mergeRequestId),
    index("unit_merge_sources_source_unit_idx").on(table.sourceUnitId),
    index("unit_merge_sources_merged_unit_idx").on(table.mergedUnitId),
  ],
);
