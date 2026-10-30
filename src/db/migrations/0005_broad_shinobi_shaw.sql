ALTER TABLE "user" ADD COLUMN "disabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
CREATE INDEX "categories_property_id_idx" ON "categories" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "rate_history_unit_id_idx" ON "rate_history" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "units_category_id_idx" ON "units" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "units_archived_at_idx" ON "units" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "units_updated_at_idx" ON "units" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_entity_entity_id_idx" ON "audit_log" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log" USING btree ("actor_id");