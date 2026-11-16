ALTER TYPE "public"."document_type" ADD VALUE 'KIN_PHOTO';--> statement-breakpoint
CREATE TABLE "document_counters" (
	"key" text NOT NULL,
	"year" integer NOT NULL,
	"last_value" integer NOT NULL,
	CONSTRAINT "document_counters_key_year_pk" PRIMARY KEY("key","year")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "serial_no" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "application_form_no" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "registration_no" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "relation_prefix" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "relation_name" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "phone_office" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "phone_res" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "mobile_2" text;--> statement-breakpoint
ALTER TABLE "next_of_kin" ADD COLUMN "relation_prefix" text;--> statement-breakpoint
ALTER TABLE "next_of_kin" ADD COLUMN "relation_name" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "serial_no" integer;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "application_form_no" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "registration_no" text;--> statement-breakpoint
UPDATE "clients" SET "relation_prefix" = 'S/O', "relation_name" = "full_name" WHERE "relation_prefix" IS NULL;--> statement-breakpoint
UPDATE "next_of_kin" SET "relation_prefix" = 'S/O', "relation_name" = "name" WHERE "relation_prefix" IS NULL;--> statement-breakpoint
CREATE TABLE "_document_number_backfill" (
	"kind" text NOT NULL,
	"id" uuid NOT NULL,
	"unit_code" text NOT NULL,
	"ts" timestamp NOT NULL,
	"yr" integer NOT NULL,
	"serial" integer NOT NULL
);
--> statement-breakpoint
INSERT INTO "_document_number_backfill" ("kind", "id", "unit_code", "ts", "yr", "serial")
SELECT
	kind,
	id,
	unit_code,
	ts,
	yr,
	row_number() OVER (PARTITION BY yr ORDER BY ts, id)::int
FROM (
	SELECT
		'booking'::text AS kind,
		b.id,
		u.unit_code,
		b.created_at AS ts,
		extract(year FROM b.created_at)::int AS yr
	FROM bookings b
	INNER JOIN units u ON u.id = b.unit_id
	UNION ALL
	SELECT
		'sale'::text,
		s.id,
		u.unit_code,
		s.sold_at,
		extract(year FROM s.sold_at)::int
	FROM sales s
	INNER JOIN units u ON u.id = s.unit_id
	WHERE s.booking_id IS NULL
) items;--> statement-breakpoint
UPDATE bookings b
SET
	serial_no = n.serial,
	application_form_no =
		'SM-' || split_part(n.unit_code, '-', 1) || '-' ||
		CASE WHEN strpos(n.unit_code, '-') > 0 THEN substr(n.unit_code, strpos(n.unit_code, '-') + 1) ELSE n.unit_code END || '-' ||
		to_char(n.ts, 'YY') || '-' || lpad(n.serial::text, 3, '0'),
	registration_no =
		'ASSH-' || split_part(n.unit_code, '-', 1) || '-' ||
		CASE WHEN strpos(n.unit_code, '-') > 0 THEN substr(n.unit_code, strpos(n.unit_code, '-') + 1) ELSE n.unit_code END || '-' ||
		to_char(n.ts, 'YY') || '-SM' || lpad(n.serial::text, 3, '0')
FROM "_document_number_backfill" n
WHERE n.kind = 'booking' AND b.id = n.id;--> statement-breakpoint
UPDATE sales s
SET
	serial_no = n.serial,
	application_form_no =
		'SM-' || split_part(n.unit_code, '-', 1) || '-' ||
		CASE WHEN strpos(n.unit_code, '-') > 0 THEN substr(n.unit_code, strpos(n.unit_code, '-') + 1) ELSE n.unit_code END || '-' ||
		to_char(n.ts, 'YY') || '-' || lpad(n.serial::text, 3, '0'),
	registration_no =
		'ASSH-' || split_part(n.unit_code, '-', 1) || '-' ||
		CASE WHEN strpos(n.unit_code, '-') > 0 THEN substr(n.unit_code, strpos(n.unit_code, '-') + 1) ELSE n.unit_code END || '-' ||
		to_char(n.ts, 'YY') || '-SM' || lpad(n.serial::text, 3, '0')
FROM "_document_number_backfill" n
WHERE n.kind = 'sale' AND s.id = n.id;--> statement-breakpoint
UPDATE sales s
SET
	serial_no = b.serial_no,
	application_form_no = b.application_form_no,
	registration_no = b.registration_no
FROM bookings b
WHERE s.booking_id = b.id;--> statement-breakpoint
INSERT INTO document_counters ("key", "year", "last_value")
SELECT 'FORM', yr, max(serial)
FROM "_document_number_backfill"
GROUP BY yr
ON CONFLICT ("key", "year") DO UPDATE SET last_value = GREATEST(document_counters.last_value, EXCLUDED.last_value);--> statement-breakpoint
DROP TABLE "_document_number_backfill";--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "relation_prefix" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "relation_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "next_of_kin" ALTER COLUMN "relation_prefix" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "next_of_kin" ALTER COLUMN "relation_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "serial_no" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "application_form_no" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "registration_no" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "serial_no" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "application_form_no" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "registration_no" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_application_form_no_idx" ON "bookings" USING btree ("application_form_no");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_registration_no_idx" ON "bookings" USING btree ("registration_no");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_application_form_no_idx" ON "sales" USING btree ("application_form_no");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_registration_no_idx" ON "sales" USING btree ("registration_no");
