CREATE TYPE "public"."booking_status" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'RETURNED');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('AMOUNT', 'PERCENT');--> statement-breakpoint
CREATE TYPE "public"."installment_status" AS ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'CHEQUE', 'BANK_TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."payment_plan" AS ENUM('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('ACTIVE', 'CONVERTED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('ACTIVE', 'BOUGHT_BACK');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'RESERVATION_CREATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'RESERVATION_CANCEL';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'RESERVATION_EXTEND';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'BOOKING_CREATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'BOOKING_CANCEL';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'BOOKING_RETURN';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'PAYMENT_RECORD';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'BUYBACK';--> statement-breakpoint
ALTER TYPE "public"."unit_status" ADD VALUE 'RESERVED' BEFORE 'SOLD';--> statement-breakpoint
ALTER TYPE "public"."unit_status" ADD VALUE 'BOOKED' BEFORE 'SOLD';--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"booking_no" text NOT NULL,
	"list_price" numeric(14, 2) NOT NULL,
	"discount_type" "discount_type",
	"discount_value" numeric(14, 2) DEFAULT '0' NOT NULL,
	"discount_reason" text,
	"net_price" numeric(14, 2) NOT NULL,
	"down_payment" numeric(14, 2) NOT NULL,
	"possession_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"plan" "payment_plan" NOT NULL,
	"installment_count" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"status" "booking_status" DEFAULT 'ACTIVE' NOT NULL,
	"paid_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buybacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"sale_id" uuid,
	"booking_id" uuid,
	"original_price" numeric(14, 2) NOT NULL,
	"buyback_amount" numeric(14, 2) NOT NULL,
	"method" "payment_method" NOT NULL,
	"cheque_no" text,
	"bank" text,
	"reason" text NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"cnic" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"home_address" text NOT NULL,
	"postal_address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"due_date" timestamp NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"status" "installment_status" DEFAULT 'PENDING' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "next_of_kin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relation" text NOT NULL,
	"cnic" text,
	"phone" text NOT NULL,
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"receipt_no" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"method" "payment_method" NOT NULL,
	"cheque_no" text,
	"bank" text,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"received_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"unit_id" uuid,
	"client_id" uuid,
	"paid_total" numeric(14, 2) NOT NULL,
	"deduction" numeric(14, 2) NOT NULL,
	"refund_amount" numeric(14, 2) NOT NULL,
	"method" "payment_method" NOT NULL,
	"cheque_no" text,
	"bank" text,
	"reason" text NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"start_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"duration_days" integer NOT NULL,
	"status" "reservation_status" DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"created_by" text,
	"cancelled_at" timestamp,
	"cancelled_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"booking_id" uuid,
	"sale_price" numeric(14, 2) NOT NULL,
	"sold_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"status" "sale_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buybacks" ADD CONSTRAINT "buybacks_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buybacks" ADD CONSTRAINT "buybacks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buybacks" ADD CONSTRAINT "buybacks_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buybacks" ADD CONSTRAINT "buybacks_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buybacks" ADD CONSTRAINT "buybacks_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installments" ADD CONSTRAINT "installments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_of_kin" ADD CONSTRAINT "next_of_kin_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_user_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_booking_no_idx" ON "bookings" USING btree ("booking_no");--> statement-breakpoint
CREATE INDEX "bookings_unit_id_idx" ON "bookings" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "bookings_client_id_idx" ON "bookings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "buybacks_unit_id_idx" ON "buybacks" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "buybacks_client_id_idx" ON "buybacks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "buybacks_paid_at_idx" ON "buybacks" USING btree ("paid_at");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_cnic_idx" ON "clients" USING btree ("cnic");--> statement-breakpoint
CREATE INDEX "clients_phone_idx" ON "clients" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "clients_full_name_idx" ON "clients" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "installments_booking_id_idx" ON "installments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "installments_due_date_idx" ON "installments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "installments_status_idx" ON "installments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "next_of_kin_client_id_idx" ON "next_of_kin" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_receipt_no_idx" ON "payments" USING btree ("receipt_no");--> statement-breakpoint
CREATE INDEX "payments_booking_id_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_paid_at_idx" ON "payments" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "refunds_booking_id_idx" ON "refunds" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "refunds_paid_at_idx" ON "refunds" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "reservations_unit_id_idx" ON "reservations" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "reservations_client_id_idx" ON "reservations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "reservations_status_idx" ON "reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reservations_expires_at_idx" ON "reservations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sales_unit_id_idx" ON "sales" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "sales_client_id_idx" ON "sales" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "sales_status_idx" ON "sales" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sales_sold_at_idx" ON "sales" USING btree ("sold_at");