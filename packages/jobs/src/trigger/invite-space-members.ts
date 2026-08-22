import { env } from "@floos/env/server";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { Resend } from "resend";
import { z } from "zod";

const invitePayloadSchema = z.object({
  invites: z.array(
    z.object({
      to: z.email(),
      spaceName: z.string().min(1),
      invitedByName: z.string().min(1),
      inviteUrl: z.url(),
    }),
  ),
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inviteEmailHtml(input: {
  invitedByName: string;
  spaceName: string;
  inviteUrl: string;
}) {
  const name = escapeHtml(input.invitedByName);
  const space = escapeHtml(input.spaceName);
  const url = escapeHtml(input.inviteUrl);

  return `<!DOCTYPE html>
<html>
  <body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
    <p>${name} invited you to ${space} on Floos.</p>
    <p>Join this household space to share, save and plan together.</p>
    <p>
      <a href="${url}" style="display: inline-block; padding: 10px 16px; background: #111; color: #fff; text-decoration: none; border-radius: 8px;">
        Open invite
      </a>
    </p>
    <p style="color: #666; font-size: 13px;">This invite expires in 14 days.</p>
  </body>
</html>`;
}

export const inviteSpaceMembers = schemaTask({
  id: "invite-space-members",
  schema: invitePayloadSchema,
  maxDuration: 30,
  queue: { concurrencyLimit: 10 },
  run: async ({ invites }) => {
    if (invites.length === 0) {
      return { sent: 0, skipped: true };
    }

    const apiKey = env.RESEND_API_KEY;
    const from = env.EMAIL_FROM;

    if (!apiKey || !from) {
      if (env.NODE_ENV === "production") {
        throw new Error("RESEND_API_KEY and EMAIL_FROM are required in production");
      }

      logger.info("Skipping invite emails (no Resend config in development)", {
        count: invites.length,
      });
      return { sent: 0, skipped: true };
    }

    const resend = new Resend(apiKey);
    let sent = 0;

    for (const invite of invites) {
      const { error } = await resend.emails.send({
        from,
        to: invite.to,
        subject: `${invite.invitedByName} invited you to ${invite.spaceName}`,
        html: inviteEmailHtml(invite),
      });

      if (error) {
        throw new Error(`Failed to send invite email to ${invite.to}: ${error.message}`);
      }

      sent += 1;
    }

    logger.info("Invite emails sent", { sent });
    return { sent, skipped: false };
  },
});
