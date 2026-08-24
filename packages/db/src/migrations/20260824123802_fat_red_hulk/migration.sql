CREATE TABLE "transaction_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"space_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text,
	"description" text,
	"system" boolean DEFAULT false NOT NULL,
	"excluded" boolean DEFAULT false NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_categories_space_slug_uidx" UNIQUE("space_id","slug")
);
--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD COLUMN "category_slug" text;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD COLUMN "enrichment_completed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "transaction_categories_space_id_idx" ON "transaction_categories" ("space_id");--> statement-breakpoint
CREATE INDEX "transaction_categories_parent_id_idx" ON "transaction_categories" ("parent_id");--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_space_id_category_slug_fkey" FOREIGN KEY ("space_id","category_slug") REFERENCES "transaction_categories"("space_id","slug");--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_parent_id_transaction_categories_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "transaction_categories"("id") ON DELETE SET NULL;