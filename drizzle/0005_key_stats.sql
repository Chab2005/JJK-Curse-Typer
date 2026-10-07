CREATE TABLE "key_stats" (
	"user_id" integer NOT NULL,
	"char" text NOT NULL,
	"error_rate" real NOT NULL,
	"avg_ms" real NOT NULL,
	CONSTRAINT "key_stats_user_id_char_pk" PRIMARY KEY("user_id","char")
);
--> statement-breakpoint
ALTER TABLE "key_stats" ADD CONSTRAINT "key_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;