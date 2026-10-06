ALTER TABLE "results" ADD COLUMN "rank" integer;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "players" integer;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "errors" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "keystrokes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "results_user_id_idx" ON "results" USING btree ("user_id");