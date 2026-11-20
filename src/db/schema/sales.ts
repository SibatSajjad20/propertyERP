import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  agreementStatusEnum,
  bookingStatusEnum,
  discountTypeEnum,
  documentOwnerTypeEnum,
  documentTypeEnum,
  installmentStatusEnum,
  installmentTypeEnum,
  paymentCategoryEnum,
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
    title: text("title").default("Mr").notNull(),
    fullName: text("full_name").notNull(),
    relationPrefix: text("relation_prefix").notNull(),
    relationName: text("relation_name").notNull(),
    cnic: text("cnic").notNull(),
    phone: text("phone").notNull(),
    phoneOffice: text("phone_office"),
    phoneRes: text("phone_res"),
    mobile2: text("mobile_2"),
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
    relationPrefix: text("relation_prefix").notNull(),
    relationName: text("relation_name").notNull(),
    relation: text("relation").notNull(),
    cnic: text("cnic"),
    phone: text("phone").notNull(),
    address: text("address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("next_of_kin_client_id_idx").on(table.clientId)],
);

export const clientDocuments = pgTable(
  "client_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerType: documentOwnerTypeEnum("owner_type").notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    kinId: uuid("kin_id").references(() => nextOfKin.id, { onDelete: "cascade" }),
    docType: documentTypeEnum("doc_type").notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    replacedAt: timestamp("replaced_at"),
  },
  (table) => [
    index("client_documents_client_doc_type_idx").on(table.clientId, table.docType),
    index("client_documents_kin_doc_type_idx").on(table.kinId, table.docType),
  ],
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
    tokenAmount: numeric("token_amount", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    tokenPaymentMethod: paymentMethodEnum("token_payment_method"),
    tokenChequeNo: text("token_cheque_no"),
    tokenBank: text("token_bank"),
    tokenReference: text("token_reference"),
    tokenReceiptNo: text("token_receipt_no"),
    tokenPaidAt: timestamp("token_paid_at"),
    tokenAdjustedToBookingId: uuid("token_adjusted_to_booking_id"),
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
    uniqueIndex("reservations_token_receipt_no_idx").on(table.tokenReceiptNo),
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
    serialNo: integer("serial_no").notNull(),
    applicationFormNo: text("application_form_no").notNull(),
    registrationNo: text("registration_no").notNull(),
    listPrice: numeric("list_price", { precision: 14, scale: 2 }).notNull(),
    discountType: discountTypeEnum("discount_type"),
    discountValue: numeric("discount_value", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    discountReason: text("discount_reason"),
    netPrice: numeric("net_price", { precision: 14, scale: 2 }).notNull(),
    downPaymentType: discountTypeEnum("down_payment_type").default("AMOUNT").notNull(),
    downPaymentInputValue: numeric("down_payment_input_value", {
      precision: 14,
      scale: 2,
    }),
    downPayment: numeric("down_payment", { precision: 14, scale: 2 }).notNull(),
    possessionType: discountTypeEnum("possession_type").default("PERCENT").notNull(),
    possessionInputValue: numeric("possession_input_value", {
      precision: 14,
      scale: 2,
    }),
    possessionAmount: numeric("possession_amount", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    balloonType: discountTypeEnum("balloon_type").default("PERCENT").notNull(),
    balloonInputValue: numeric("balloon_input_value", {
      precision: 14,
      scale: 2,
    })
      .default("10")
      .notNull(),
    balloonAmountPerYear: numeric("balloon_amount_per_year", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),
    balloonTotalAmount: numeric("balloon_total_amount", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),
    tokenAdjustedAmount: numeric("token_adjusted_amount", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    plan: paymentPlanEnum("plan").notNull(),
    installmentCount: integer("installment_count").notNull(),
    startDate: timestamp("start_date").notNull(),
    status: bookingStatusEnum("status").default("ACTIVE").notNull(),
    paidTotal: numeric("paid_total", { precision: 14, scale: 2 }).default("0").notNull(),
    surchargeExempt: boolean("surcharge_exempt").default(false).notNull(),
    surchargeExemptReason: text("surcharge_exempt_reason"),
    surchargeExemptBy: text("surcharge_exempt_by").references(() => user.id, {
      onDelete: "set null",
    }),
    surchargeExemptAt: timestamp("surcharge_exempt_at"),
    salesAgent: text("sales_agent"),
    bookingOffice: text("booking_office").default("SARDAR'S MALL").notNull(),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("bookings_booking_no_idx").on(table.bookingNo),
    uniqueIndex("bookings_application_form_no_idx").on(table.applicationFormNo),
    uniqueIndex("bookings_registration_no_idx").on(table.registrationNo),
    index("bookings_unit_id_idx").on(table.unitId),
    index("bookings_client_id_idx").on(table.clientId),
    index("bookings_status_idx").on(table.status),
    index("bookings_created_at_idx").on(table.createdAt),
    index("bookings_status_created_at_idx").on(table.status, table.createdAt),
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
    type: installmentTypeEnum("type").default("REGULAR").notNull(),
    label: text("label"),
    dueDate: timestamp("due_date").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    status: installmentStatusEnum("status").default("PENDING").notNull(),
    paidAt: timestamp("paid_at"),
    receiptNos: text("receipt_nos"),
    surchargeWaived: boolean("surcharge_waived").default(false).notNull(),
    surchargeWaivedAmount: numeric("surcharge_waived_amount", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),
    surchargeWaivedReason: text("surcharge_waived_reason"),
    surchargeWaivedBy: text("surcharge_waived_by").references(() => user.id, {
      onDelete: "set null",
    }),
    surchargeWaivedAt: timestamp("surcharge_waived_at"),
    surchargePaidAmount: numeric("surcharge_paid_amount", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("installments_booking_id_idx").on(table.bookingId),
    index("installments_due_date_idx").on(table.dueDate),
    index("installments_status_idx").on(table.status),
    index("installments_paid_at_idx").on(table.paidAt),
    index("installments_booking_status_due_idx").on(
      table.bookingId,
      table.status,
      table.dueDate,
    ),
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
    category: paymentCategoryEnum("category").default("INSTALLMENT").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    surchargeAmount: numeric("surcharge_amount", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    method: paymentMethodEnum("method").notNull(),
    chequeNo: text("cheque_no"),
    bank: text("bank"),
    reference: text("reference"),
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
    index("payments_is_voided_paid_at_idx").on(table.isVoided, table.paidAt),
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
    serialNo: integer("serial_no").notNull(),
    applicationFormNo: text("application_form_no").notNull(),
    registrationNo: text("registration_no").notNull(),
    salePrice: numeric("sale_price", { precision: 14, scale: 2 }).notNull(),
    soldAt: timestamp("sold_at").defaultNow().notNull(),
    notes: text("notes"),
    paymentMethod: paymentMethodEnum("payment_method"),
    chequeNo: text("cheque_no"),
    bank: text("bank"),
    reference: text("reference"),
    salesAgent: text("sales_agent"),
    bookingOffice: text("booking_office").default("SARDAR'S MALL").notNull(),
    status: saleStatusEnum("status").default("ACTIVE").notNull(),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sales_application_form_no_idx").on(table.applicationFormNo),
    uniqueIndex("sales_registration_no_idx").on(table.registrationNo),
    index("sales_unit_id_idx").on(table.unitId),
    index("sales_client_id_idx").on(table.clientId),
    index("sales_status_idx").on(table.status),
    index("sales_sold_at_idx").on(table.soldAt),
    index("sales_booking_id_idx").on(table.bookingId),
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

export const companySettings = pgTable("company_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  bankName: text("bank_name").default("").notNull(),
  accountTitle: text("account_title").default("").notNull(),
  iban: text("iban").default("").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const authorizedSignatories = pgTable(
  "authorized_signatories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    designation: text("designation").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("authorized_signatories_sort_idx").on(table.sortOrder)],
);

export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
    saleId: uuid("sale_id").references(() => sales.id, { onDelete: "cascade" }),
    receiptNo: text("receipt_no").notNull(),
    type: text("type").default("DOWN_PAYMENT").notNull(),
    signatoryId: uuid("signatory_id").references(() => authorizedSignatories.id, {
      onDelete: "set null",
    }),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("receipts_receipt_no_idx").on(table.receiptNo),
    uniqueIndex("receipts_booking_type_idx").on(table.bookingId, table.type),
    uniqueIndex("receipts_sale_type_idx").on(table.saleId, table.type),
    index("receipts_booking_id_idx").on(table.bookingId),
    index("receipts_sale_id_idx").on(table.saleId),
  ],
);

export const documentCounters = pgTable(
  "document_counters",
  {
    key: text("key").notNull(),
    year: integer("year").notNull(),
    lastValue: integer("last_value").notNull(),
  },
  (table) => [primaryKey({ columns: [table.key, table.year] })],
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
    index("refunds_client_id_idx").on(table.clientId),
  ],
);

export const agreements = pgTable(
  "agreements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agreementNo: text("agreement_no").notNull(),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    saleId: uuid("sale_id").references(() => sales.id, { onDelete: "set null" }),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "restrict" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    sellerName: text("seller_name").default("Mr. Afnan Khan").notNull(),
    agreementDate: timestamp("agreement_date").defaultNow().notNull(),
    anticipatedCompletionDate: text("anticipated_completion_date")
      .default("Feb-2029")
      .notNull(),
    buyerNationality: text("buyer_nationality").default("Pakistani").notNull(),
    nomineeNationality: text("nominee_nationality").default("Pakistani").notNull(),
    witness1Name: text("witness_1_name"),
    witness2Name: text("witness_2_name"),
    status: agreementStatusEnum("status").default("DRAFT").notNull(),
    signedStoragePath: text("signed_storage_path"),
    signedMimeType: text("signed_mime_type"),
    signedFileName: text("signed_file_name"),
    signedUploadedAt: timestamp("signed_uploaded_at"),
    signedUploadedBy: text("signed_uploaded_by").references(() => user.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("agreements_agreement_no_idx").on(table.agreementNo),
    index("agreements_booking_id_idx").on(table.bookingId),
    index("agreements_sale_id_idx").on(table.saleId),
    index("agreements_unit_id_idx").on(table.unitId),
    index("agreements_client_id_idx").on(table.clientId),
    index("agreements_status_idx").on(table.status),
  ],
);
