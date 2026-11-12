CREATE TABLE "room_members" (
	"viewer_id" text PRIMARY KEY NOT NULL,
	"lobby_code" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "room_members_lobby_code_idx" ON "room_members" USING btree ("lobby_code");