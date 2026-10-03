CREATE TABLE "lobby_invites" (
	"token" text PRIMARY KEY NOT NULL,
	"lobby_code" text NOT NULL,
	"claimed_ip" text,
	"claimed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"claimed_at" timestamp,
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "lobby_invites_lobby_code_idx" ON "lobby_invites" USING btree ("lobby_code");