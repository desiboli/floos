CREATE TABLE "space_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"space_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"invited_by" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "space_invites_token_hash_uidx" ON "space_invites" ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "space_invites_space_id_email_pending_uidx" ON "space_invites" ("space_id","email") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "space_invites_email_idx" ON "space_invites" ("email");--> statement-breakpoint
CREATE INDEX "space_invites_space_id_idx" ON "space_invites" ("space_id");--> statement-breakpoint
ALTER TABLE "space_invites" ADD CONSTRAINT "space_invites_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_invites" ADD CONSTRAINT "space_invites_invited_by_user_id_fkey" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE CASCADE;