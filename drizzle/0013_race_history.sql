CREATE TABLE "race_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"race_id" integer NOT NULL,
	"user_id" integer,
	"seat_id" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"is_bot" boolean NOT NULL,
	"bot_level" text,
	"rank" integer NOT NULL,
	"wpm" real NOT NULL,
	"raw_wpm" real NOT NULL,
	"accuracy" real NOT NULL,
	"errors" integer NOT NULL,
	"ended_at_ms" integer,
	"status" text NOT NULL,
	"received" integer NOT NULL,
	"series" jsonb NOT NULL,
	"missed_keys" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "races" (
	"id" serial PRIMARY KEY NOT NULL,
	"lobby_code" text NOT NULL,
	"text" text NOT NULL,
	"settings" jsonb NOT NULL,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp NOT NULL,
	"players" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "race_id" integer;--> statement-breakpoint
ALTER TABLE "race_participants" ADD CONSTRAINT "race_participants_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_participants" ADD CONSTRAINT "race_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "race_participants_race_seat_idx" ON "race_participants" USING btree ("race_id","seat_id");--> statement-breakpoint
CREATE INDEX "race_participants_user_id_idx" ON "race_participants" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "results_race_id_idx" ON "results" USING btree ("race_id");