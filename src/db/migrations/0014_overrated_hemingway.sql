CREATE TYPE "public"."agreement_status" AS ENUM('DRAFT', 'GENERATED', 'SIGNED_UPLOADED');--> statement-breakpoint
CREATE TYPE "public"."installment_type" AS ENUM('REGULAR', 'BALLOON', 'POSSESSION');--> statement-breakpoint
CREATE TYPE "public"."merge_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."payment_category" AS ENUM('TOKEN', 'DOWN_PAYMENT', 'INSTALLMENT', 'POSSESSION', 'BALLOON', 'SURCHARGE');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'UNIT_MERGE_REQUEST';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'UNIT_MERGE_APPROVE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'UNIT_MERGE_REJECT';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'UNIT_RESTRUCTURE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'SURCHARGE_WAIVE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'SURCHARGE_EXEMPT';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'AGREEMENT_CREATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'AGREEMENT_UPLOAD';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'LIVE_PHOTO';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'KIN_LIVE_PHOTO';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'THUMB_IMPRESSION';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'KIN_THUMB_IMPRESSION';--> statement-breakpoint
CREATE TABLE "unit_merge_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"status" "merge_request_status" DEFAULT 'PENDING' NOT NULL,
	"proposed_unit_code" text NOT NULL,
	"proposed_unit_number" text NOT NULL,
	"target_floor_id" uuid NOT NULL,
	"target_category_id" uuid NOT NULL,
	"proposed_net_area_sqft" numeric(10, 2) NOT NULL,
	"proposed_gross_area_sqft" numeric(10, 2) NOT NULL,
	"proposed_rate_per_sqft_pkr" numeric(14, 2) NOT NULL,
	"proposed_price_adjustment_pkr" numeric(14, 2) DEFAULT '0' NOT NULL,
	"proposed_price_adjustment_reason" text,
	"reason" text NOT NULL,
	"proof_storage_path" text NOT NULL,
	"proof_mime_type" text NOT NULL,
	"proof_file_name" text,
	"source_units_snapshot" jsonb NOT NULL,
	"resulting_unit_id" uuid,
	"requested_by" text NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_merge_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merge_request_id" uuid NOT NULL,
	"source_unit_id" uuid NOT NULL,
	"merged_unit_id" uuid,
	"unit_code" text NOT NULL,
	"unit_number" text NOT NULL,
	"floor_name" text NOT NULL,
	"category_name" text NOT NULL,
	"net_area_sqft" numeric(10, 2) NOT NULL,
	"gross_area_sqft" numeric(10, 2),
	"rate_per_sqft_pkr" numeric(14, 2) NOT NULL,
	"computed_price_pkr" numeric(14, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agreement_no" text NOT NULL,
	"booking_id" uuid,
	"sale_id" uuid,
	"unit_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"seller_name" text DEFAULT 'Mr. Afnan Khan' NOT NULL,
	"agreement_date" timestamp DEFAULT now() NOT NULL,
	"anticipated_completion_date" text DEFAULT 'Feb-2029' NOT NULL,
	"buyer_nationality" text DEFAULT 'Pakistani' NOT NULL,
	"nominee_nationality" text DEFAULT 'Pakistani' NOT NULL,
	"witness_1_name" text,
	"witness_2_name" text,
	"status" "agreement_status" DEFAULT 'DRAFT' NOT NULL,
	"signed_storage_path" text,
	"signed_mime_type" text,
	"signed_file_name" text,
	"signed_uploaded_at" timestamp,
	"signed_uploaded_by" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP VIEW "public"."unit_pricing";--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "is_merged_unit" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "merged_into_unit_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "down_payment_type" "discount_type" DEFAULT 'AMOUNT' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "down_payment_input_value" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "possession_type" "discount_type" DEFAULT 'PERCENT' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "possession_input_value" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "balloon_type" "discount_type" DEFAULT 'PERCENT' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "balloon_input_value" numeric(14, 2) DEFAULT '10' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "balloon_amount_per_year" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "balloon_total_amount" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "token_adjusted_amount" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "reservation_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "surcharge_exempt" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "surcharge_exempt_reason" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "surcharge_exempt_by" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "surcharge_exempt_at" timestamp;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "type" "installment_type" DEFAULT 'REGULAR' NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "surcharge_waived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "surcharge_waived_amount" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "surcharge_waived_reason" text;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "surcharge_waived_by" text;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "surcharge_waived_at" timestamp;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "surcharge_paid_amount" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "category" "payment_category" DEFAULT 'INSTALLMENT' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "surcharge_amount" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "token_amount" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "token_payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "token_cheque_no" text;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "token_bank" text;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "token_reference" text;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "token_receipt_no" text;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "token_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "token_adjusted_to_booking_id" uuid;--> statement-breakpoint
ALTER TABLE "unit_merge_requests" ADD CONSTRAINT "unit_merge_requests_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_merge_requests" ADD CONSTRAINT "unit_merge_requests_target_floor_id_floors_id_fk" FOREIGN KEY ("target_floor_id") REFERENCES "public"."floors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_merge_requests" ADD CONSTRAINT "unit_merge_requests_target_category_id_categories_id_fk" FOREIGN KEY ("target_category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_merge_requests" ADD CONSTRAINT "unit_merge_requests_resulting_unit_id_units_id_fk" FOREIGN KEY ("resulting_unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_merge_requests" ADD CONSTRAINT "unit_merge_requests_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_merge_requests" ADD CONSTRAINT "unit_merge_requests_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_merge_sources" ADD CONSTRAINT "unit_merge_sources_merge_request_id_unit_merge_requests_id_fk" FOREIGN KEY ("merge_request_id") REFERENCES "public"."unit_merge_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_merge_sources" ADD CONSTRAINT "unit_merge_sources_source_unit_id_units_id_fk" FOREIGN KEY ("source_unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_merge_sources" ADD CONSTRAINT "unit_merge_sources_merged_unit_id_units_id_fk" FOREIGN KEY ("merged_unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_signed_uploaded_by_user_id_fk" FOREIGN KEY ("signed_uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unit_merge_requests_status_idx" ON "unit_merge_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "unit_merge_requests_resulting_unit_idx" ON "unit_merge_requests" USING btree ("resulting_unit_id");--> statement-breakpoint
CREATE INDEX "unit_merge_requests_created_at_idx" ON "unit_merge_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "unit_merge_sources_merge_request_idx" ON "unit_merge_sources" USING btree ("merge_request_id");--> statement-breakpoint
CREATE INDEX "unit_merge_sources_source_unit_idx" ON "unit_merge_sources" USING btree ("source_unit_id");--> statement-breakpoint
CREATE INDEX "unit_merge_sources_merged_unit_idx" ON "unit_merge_sources" USING btree ("merged_unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agreements_agreement_no_idx" ON "agreements" USING btree ("agreement_no");--> statement-breakpoint
CREATE INDEX "agreements_booking_id_idx" ON "agreements" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "agreements_sale_id_idx" ON "agreements" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "agreements_unit_id_idx" ON "agreements" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "agreements_client_id_idx" ON "agreements" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "agreements_status_idx" ON "agreements" USING btree ("status");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_surcharge_exempt_by_user_id_fk" FOREIGN KEY ("surcharge_exempt_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installments" ADD CONSTRAINT "installments_surcharge_waived_by_user_id_fk" FOREIGN KEY ("surcharge_waived_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "units_merged_into_unit_id_idx" ON "units" USING btree ("merged_into_unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_token_receipt_no_idx" ON "reservations" USING btree ("token_receipt_no");--> statement-breakpoint
CREATE VIEW "public"."unit_pricing" AS (select "id" as "unit_id", round(("rate_per_sqft_pkr" * coalesce("gross_area_sqft", "net_area_sqft")) + coalesce("price_adjustment_pkr", 0), 0)::numeric(14, 2) as "computed_price_pkr" from "units");--> statement-breakpoint
INSERT INTO "categories" ("property_id", "name", "is_sellable_default")
SELECT p."id", v."name", true
FROM "properties" p
CROSS JOIN (
  VALUES
    ('Mall Shops'),
    ('Commercial Shops'),
    ('Food Court'),
    ('Kiosks'),
    ('Corporate Offices'),
    ('Residential Apartments')
) AS v("name")
WHERE NOT EXISTS (
  SELECT 1 FROM "categories" c
  WHERE c."property_id" = p."id" AND lower(c."name") = lower(v."name")
);--> statement-breakpoint
UPDATE "units"
SET "unit_number" = 'Apartment No. ' || "unit_code"
WHERE ("unit_number" ILIKE 'APARTMENT BLOCK%' OR "unit_code" ~* '-RA[0-9]+$')
  AND "unit_number" NOT ILIKE 'Apartment No.%';--> statement-breakpoint
UPDATE "payments"
SET "category" = 'DOWN_PAYMENT'
WHERE "category" = 'INSTALLMENT'
  AND ("notes" ILIKE '%down payment%' OR "receipt_no" LIKE 'SM-DPR-%');