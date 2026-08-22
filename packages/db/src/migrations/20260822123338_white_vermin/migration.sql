ALTER TABLE "bank_transactions" ADD COLUMN "status" text DEFAULT 'posted' NOT NULL;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD COLUMN "method" text;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD COLUMN "counterparty_name" text;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD COLUMN "merchant_name" text;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD COLUMN "balance" numeric(12,2);--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD COLUMN "currency_rate" numeric;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD COLUMN "currency_source" text;