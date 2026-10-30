ALTER TABLE "floors" ALTER COLUMN "level" SET DATA TYPE integer USING (
  CASE
    WHEN "level" IS NULL THEN 0
    WHEN "level" ~ '^-?[0-9]+$' THEN "level"::integer
    ELSE 0
  END
);--> statement-breakpoint
ALTER TABLE "floors" ALTER COLUMN "level" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "blocks" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "floors" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "archived_at" timestamp;