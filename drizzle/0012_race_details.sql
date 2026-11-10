ALTER TABLE "results" ADD COLUMN "raw_wpm" real;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "received" integer;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "series" jsonb;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "missed_keys" jsonb;