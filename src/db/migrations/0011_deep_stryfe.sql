CREATE TYPE "public"."document_owner_type" AS ENUM('CLIENT', 'KIN');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('PHOTO', 'CNIC_FRONT', 'CNIC_BACK');--> statement-breakpoint
CREATE TABLE "client_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_type" "document_owner_type" NOT NULL,
	"client_id" uuid NOT NULL,
	"kin_id" uuid,
	"doc_type" "document_type" NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"replaced_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_kin_id_next_of_kin_id_fk" FOREIGN KEY ("kin_id") REFERENCES "public"."next_of_kin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_documents_client_doc_type_idx" ON "client_documents" USING btree ("client_id","doc_type");--> statement-breakpoint
CREATE INDEX "client_documents_kin_doc_type_idx" ON "client_documents" USING btree ("kin_id","doc_type");