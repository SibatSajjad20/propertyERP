import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blocks = pgTable(
  "blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("blocks_property_id_idx").on(table.propertyId)],
);

export const floors = pgTable(
  "floors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    blockId: uuid("block_id")
      .notNull()
      .references(() => blocks.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    level: integer("level").notNull(),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("floors_block_id_idx").on(table.blockId),
    index("floors_level_idx").on(table.level),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    isSellableDefault: boolean("is_sellable_default").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("categories_property_id_idx").on(table.propertyId)],
);
