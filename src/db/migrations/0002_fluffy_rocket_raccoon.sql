DROP VIEW "public"."unit_pricing";--> statement-breakpoint
ALTER TABLE "rate_history" ADD COLUMN "old_rate_per_sqft_pkr" numeric(14, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "rate_history" ADD COLUMN "reason" text NOT NULL;--> statement-breakpoint
CREATE VIEW "public"."unit_pricing" AS (select "id" as "unit_id", round(("rate_per_sqft_pkr" * "net_area_sqft") + coalesce("price_adjustment_pkr", 0), 0)::numeric(14, 2) as "computed_price_pkr" from "units");