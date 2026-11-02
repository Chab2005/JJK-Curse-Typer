CREATE TABLE "character_stats" (
	"user_id" integer NOT NULL,
	"character" text NOT NULL,
	"games" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "character_stats_user_id_character_pk" PRIMARY KEY("user_id","character")
);
--> statement-breakpoint
ALTER TABLE "character_stats" ADD CONSTRAINT "character_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;