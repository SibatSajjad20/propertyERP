ALTER TYPE "public"."payment_method" ADD VALUE 'PAY_ORDER';--> statement-breakpoint
CREATE TABLE "authorized_signatories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"designation" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_name" text DEFAULT '' NOT NULL,
	"account_title" text DEFAULT '' NOT NULL,
	"iban" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"sale_id" uuid,
	"receipt_no" text NOT NULL,
	"type" text DEFAULT 'DOWN_PAYMENT' NOT NULL,
	"signatory_id" uuid,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "sales_agent" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "booking_office" text DEFAULT 'SARDAR''S MALL' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "reference" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "cheque_no" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "bank" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "reference" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "sales_agent" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "booking_office" text DEFAULT 'SARDAR''S MALL' NOT NULL;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_signatory_id_authorized_signatories_id_fk" FOREIGN KEY ("signatory_id") REFERENCES "public"."authorized_signatories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "authorized_signatories_sort_idx" ON "authorized_signatories" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_receipt_no_idx" ON "receipts" USING btree ("receipt_no");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_booking_type_idx" ON "receipts" USING btree ("booking_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_sale_type_idx" ON "receipts" USING btree ("sale_id","type");--> statement-breakpoint
CREATE INDEX "receipts_booking_id_idx" ON "receipts" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "receipts_sale_id_idx" ON "receipts" USING btree ("sale_id");
--> statement-breakpoint
INSERT INTO "company_settings" ("bank_name", "account_title", "iban")
VALUES ('', '', '');
--> statement-breakpoint
INSERT INTO "authorized_signatories" ("name", "designation", "sort_order", "is_active")
VALUES
  ('Afnan Khan', 'Chief Executive Officer', 0, true),
  ('Ikram Ullah', 'Partner/Investor', 1, true),
  ('Muhammad Ali Khan', 'Director of Sales', 2, true),
  ('Abid Hussain', 'Partner/Investor', 3, true);
--> statement-breakpoint
UPDATE "payments"
SET "reference" = COALESCE(NULLIF("cheque_no", ''), "notes")
WHERE "reference" IS NULL;
--> statement-breakpoint
UPDATE "bookings" b
SET "sales_agent" = u."name"
FROM "user" u
WHERE b."created_by" = u."id" AND b."sales_agent" IS NULL;
--> statement-breakpoint
UPDATE "sales" s
SET "sales_agent" = u."name"
FROM "user" u
WHERE s."created_by" = u."id" AND s."sales_agent" IS NULL;