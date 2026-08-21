CREATE TYPE "bank_provider" AS ENUM('gocardless', 'enablebanking');--> statement-breakpoint
CREATE TYPE "connection_status" AS ENUM('pending', 'connected', 'disconnected');--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"logo" text,
	"provider" "bank_provider" NOT NULL,
	"countries" text[] NOT NULL,
	"available_history" integer,
	"psu_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"space_id" uuid NOT NULL,
	"institution_id" text NOT NULL,
	"provider" "bank_provider" NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"access_token" text,
	"reference_id" text,
	"status" "connection_status" DEFAULT 'pending'::"connection_status" NOT NULL,
	"expires_at" timestamp with time zone,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_bank_connection" UNIQUE("institution_id","space_id")
);
--> statement-breakpoint
CREATE INDEX "institutions_countries_idx" ON "institutions" USING gin ("countries");--> statement-breakpoint
CREATE INDEX "bank_connections_space_id_idx" ON "bank_connections" ("space_id");--> statement-breakpoint
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;