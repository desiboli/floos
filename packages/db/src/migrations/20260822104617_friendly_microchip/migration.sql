CREATE TYPE "account_type" AS ENUM('depository', 'credit', 'loan', 'investment', 'other');--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"space_id" uuid NOT NULL,
	"bank_connection_id" uuid,
	"account_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"currency" text NOT NULL,
	"balance" numeric(12,2) DEFAULT '0',
	"available_balance" numeric(12,2),
	"credit_limit" numeric(12,2),
	"iban" text,
	"bic" text,
	"is_manual" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_bank_account_per_connection" UNIQUE("bank_connection_id","account_id")
);
--> statement-breakpoint
CREATE INDEX "bank_accounts_space_id_idx" ON "bank_accounts" ("space_id");--> statement-breakpoint
CREATE INDEX "bank_accounts_connection_id_idx" ON "bank_accounts" ("bank_connection_id");--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_bank_connection_id_bank_connections_id_fkey" FOREIGN KEY ("bank_connection_id") REFERENCES "bank_connections"("id") ON DELETE CASCADE;