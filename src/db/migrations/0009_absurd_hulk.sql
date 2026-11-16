CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_status_created_at_idx" ON "bookings" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "installments_booking_status_due_idx" ON "installments" USING btree ("booking_id","status","due_date");--> statement-breakpoint
CREATE INDEX "payments_is_voided_paid_at_idx" ON "payments" USING btree ("is_voided","paid_at");--> statement-breakpoint
CREATE INDEX "refunds_client_id_idx" ON "refunds" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "sales_booking_id_idx" ON "sales" USING btree ("booking_id");