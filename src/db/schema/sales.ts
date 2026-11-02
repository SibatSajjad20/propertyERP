import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  bookingStatusEnum,
  discountTypeEnum,
  installmentStatusEnum,
  paymentMethodEnum,
  paymentPlanEnum,
  reservationStatusEnum,
  saleStatusEnum,
} from "./enums";
import { units } from "./units";

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    cnic: text("cnic").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    homeAddress: text("home_address").notNull(),
    postalAddress: text("postal_address").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("clients_cnic_idx").on(table.cnic),
    index("clients_phone_idx").on(table.phone),
    index("clients_full_name_idx").on(table.fullName),
  ],
);

export const nextOfKin = pgTable(
  "next_of_kin",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    relation: text("relation").notNull(),
    cnic: text("cnic"),
    phone: text("phone").notNull(),
    address: text("address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("next_of_kin_client_id_idx").on(table.clientId)],
);

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "restrict" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    startAt: timestamp("start_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    durationDays: integer("duration_days").notNull(),
    status: reservationStatusEnum("status").default("ACTIVE").notNull(),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    cancelledAt: timestamp("cancelled_at"),
    cancelledReason: text("cancelled_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("reservations_unit_id_idx").on(table.unitId),
    index("reservations_client_id_idx").on(table.clientId),
    index("reservations_status_idx").on(table.status),
    index("reservations_expires_at_idx").on(table.expiresAt),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "restrict" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    bookingNo: text("booking_no").notNull(),
    listPrice: numeric("list_price", { precision: 14, scale: 2 }).notNull(),
    discountType: discountTypeEnum("discount_type"),
    discountValue: numeric("discount_value", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    discountReason: text("discount_reason"),
    netPrice: numeric("net_price", { precision: 14, scale: 2 }).notNull(),
    downPayment: numeric("down_payment", { precision: 14, scale: 2 }).notNull(),
    possessionAmount: numeric("possession_amount", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    plan: paymentPlanEnum("plan").notNull(),
    installmentCount: integer("installment_count").notNull(),
    startDate: timestamp("start_date").notNull(),
    status: bookingStatusEnum("status").default("ACTIVE").notNull(),
    paidTotal: numeric("paid_total", { precision: 14, scale: 2 }).default("0").notNull(),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("bookings_booking_no_idx").on(table.bookingNo),
    index("bookings_unit_id_idx").on(table.unitId),
    index("bookings_client_id_idx").on(table.clientId),
    index("bookings_status_idx").on(table.status),
    index("bookings_created_at_idx").on(table.createdAt),
  ],
);

export const installments = pgTable(
  "installments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    dueDate: timestamp("due_date").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    status: installmentStatusEnum("status").default("PENDING").notNull(),
    paidAt: timestamp("paid_at"),
    receiptNos: text("receipt_nos"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("installments_booking_id_idx").on(table.bookingId),
    index("installments_due_date_idx").on(table.dueDate),
    index("installments_status_idx").on(table.status),
    index("installments_paid_at_idx").on(table.paidAt),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    receiptNo: text("receipt_no").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    method: paymentMethodEnum("method").notNull(),
    chequeNo: text("cheque_no"),
    bank: text("bank"),
    paidAt: timestamp("paid_at").defaultNow().notNull(),
    notes: text("notes"),
    receivedBy: text("received_by").references(() => user.id, {
      onDelete: "set null",
    }),
    isVoided: boolean("is_voided").default(false).notNull(),
    voidedAt: timestamp("voided_at"),
    voidedReason: text("voided_reason"),
    voidedBy: text("voided_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("payments_receipt_no_idx").on(table.receiptNo),
    index("payments_booking_id_idx").on(table.bookingId),
    index("payments_paid_at_idx").on(table.paidAt),
    index("payments_is_voided_idx").on(table.isVoided),
  ],
);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "restrict" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),
    salePrice: numeric("sale_price", { precision: 14, scale: 2 }).notNull(),
    soldAt: timestamp("sold_at").defaultNow().notNull(),
    notes: text("notes"),
    status: saleStatusEnum("status").default("ACTIVE").notNull(),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sales_unit_id_idx").on(table.unitId),
    index("sales_client_id_idx").on(table.clientId),
    index("sales_status_idx").on(table.status),
    index("sales_sold_at_idx").on(table.soldAt),
  ],
);

export const buybacks = pgTable(
  "buybacks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "restrict" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    saleId: uuid("sale_id").references(() => sales.id, { onDelete: "set null" }),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),
    originalPrice: numeric("original_price", { precision: 14, scale: 2 }).notNull(),
    buybackAmount: numeric("buyback_amount", { precision: 14, scale: 2 }).notNull(),
    method: paymentMethodEnum("method").notNull(),
    chequeNo: text("cheque_no"),
    bank: text("bank"),
    reason: text("reason").notNull(),
    paidAt: timestamp("paid_at").defaultNow().notNull(),
    approvedBy: text("approved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("buybacks_unit_id_idx").on(table.unitId),
    index("buybacks_client_id_idx").on(table.clientId),
    index("buybacks_paid_at_idx").on(table.paidAt),
  ],
);

export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    paidTotal: numeric("paid_total", { precision: 14, scale: 2 }).notNull(),
    deduction: numeric("deduction", { precision: 14, scale: 2 }).notNull(),
    refundAmount: numeric("refund_amount", { precision: 14, scale: 2 }).notNull(),
    method: paymentMethodEnum("method").notNull(),
    chequeNo: text("cheque_no"),
    bank: text("bank"),
    reason: text("reason").notNull(),
    paidAt: timestamp("paid_at").defaultNow().notNull(),
    approvedBy: text("approved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("refunds_booking_id_idx").on(table.bookingId),
    index("refunds_paid_at_idx").on(table.paidAt),
  ],
);
