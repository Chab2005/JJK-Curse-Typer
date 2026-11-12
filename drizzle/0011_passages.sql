CREATE TABLE "passages" (
	"id" serial PRIMARY KEY NOT NULL,
	"language" text NOT NULL,
	"complexity" integer NOT NULL,
	"text" text NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "passages_language_idx" ON "passages" USING btree ("language");