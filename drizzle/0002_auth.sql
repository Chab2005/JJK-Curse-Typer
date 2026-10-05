CREATE TABLE "login_attempts" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"window_start" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "oauth_accounts_provider_provider_user_id_pk" PRIMARY KEY("provider","provider_user_id")
);
--> statement-breakpoint
CREATE TABLE "oauth_pending" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_username_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar" "bytea";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_key_unique" UNIQUE("username_key");