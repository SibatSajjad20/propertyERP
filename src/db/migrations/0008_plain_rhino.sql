ALTER TYPE "public"."audit_action" ADD VALUE 'PAYMENT_VOID';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'PAYMENT_EDIT';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'INSTALLMENT_RESCHEDULE';--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "receipt_nos" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "is_voided" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "voided_at" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "voided_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "voided_by" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_voided_by_user_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "installments_paid_at_idx" ON "installments" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "payments_is_voided_idx" ON "payments" USING btree ("is_voided");