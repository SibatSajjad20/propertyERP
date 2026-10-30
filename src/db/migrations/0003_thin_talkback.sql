ALTER TABLE "unit_status_history" ADD COLUMN "booking_ref" text;--> statement-breakpoint
ALTER TABLE "unit_status_history" ADD COLUMN "sold_price_pkr" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "sold_at" timestamp;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "sold_by" text;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_sold_by_user_id_fk" FOREIGN KEY ("sold_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unit_status_history_unit_id_created_at_idx" ON "unit_status_history" USING btree ("unit_id","created_at");