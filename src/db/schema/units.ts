import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgTable,
  pgView,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { unitStatusEnum } from "./enums";
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
    status: unitStatusEnum("status").default("AVAILABLE").notNull(),
    isSellable: boolean("is_sellable").default(true).notNull(),
    ownershipGroup: text("ownership_group"),
    subOwner: text("sub_owner"),
    bookingRef: text("booking_ref"),
    notes: text("notes"),
    version: integer("version").default(1).notNull(),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("units_property_unit_code_idx").on(table.propertyId, table.unitCode),
  ],
);

export const unitPricing = pgView("unit_pricing").as((qb) =>
  qb
    .select({
      unitId: sql<string>`${units.id}`.as("unit_id"),
      computedPricePkr:
        sql<string>`round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 2)`.as(
          "computed_price_pkr",
        ),
    })
    .from(units),
);

export const unitStatusHistory = pgTable("unit_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  fromStatus: unitStatusEnum("from_status").notNull(),
  toStatus: unitStatusEnum("to_status").notNull(),
  reason: text("reason"),
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rateHistory = pgTable("rate_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  ratePerSqftPkr: numeric("rate_per_sqft_pkr", { precision: 14, scale: 2 }).notNull(),
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
