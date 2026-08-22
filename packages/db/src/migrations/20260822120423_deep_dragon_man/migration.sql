CREATE TABLE "bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"space_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"provider_transaction_id" text NOT NULL,
	"date" date NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"currency" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_bank_transaction" UNIQUE("bank_account_id","provider_transaction_id")
);
--> statement-breakpoint
CREATE INDEX "bank_transactions_space_id_idx" ON "bank_transactions" ("space_id");--> statement-breakpoint
CREATE INDEX "bank_transactions_bank_account_id_idx" ON "bank_transactions" ("bank_account_id");--> statement-breakpoint
CREATE INDEX "bank_transactions_date_idx" ON "bank_transactions" ("date");--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_id_bank_accounts_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE CASCADE;