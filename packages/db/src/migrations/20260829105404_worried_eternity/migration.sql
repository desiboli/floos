CREATE TABLE "ai_rate_limits" (
	"user_id" text,
	"bucket" text,
	"window_started_at" timestamp with time zone,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ai_rate_limits_pkey" PRIMARY KEY("user_id","bucket","window_started_at")
);
--> statement-breakpoint
ALTER TABLE "ai_rate_limits" ADD CONSTRAINT "ai_rate_limits_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;