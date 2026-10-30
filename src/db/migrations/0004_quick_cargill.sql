ALTER TABLE "import_batches" ADD COLUMN "rolled_back_at" timestamp;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "rolled_back_by" text;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_rolled_back_by_user_id_fk" FOREIGN KEY ("rolled_back_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocks_property_id_idx" ON "blocks" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "floors_block_id_idx" ON "floors" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "floors_level_idx" ON "floors" USING btree ("level");--> statement-breakpoint
CREATE INDEX "unit_status_history_to_status_created_at_idx" ON "unit_status_history" USING btree ("to_status","created_at");--> statement-breakpoint
CREATE INDEX "units_floor_id_idx" ON "units" USING btree ("floor_id");--> statement-breakpoint
CREATE INDEX "units_property_id_idx" ON "units" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "units_status_idx" ON "units" USING btree ("status");--> statement-breakpoint
CREATE INDEX "units_floor_status_idx" ON "units" USING btree ("floor_id","status");