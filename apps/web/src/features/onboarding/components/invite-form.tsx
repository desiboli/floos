import { Button } from "@floos/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@floos/ui/components/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@floos/ui/components/field";
import { TagInput } from "@floos/ui/components/tag-input";
import { toast } from "@floos/ui/components/toast";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import type { SkippedInvite } from "@/features/invites/services/types";

import { createInvites } from "@/features/invites/services/api";
import { m } from "@/paraglide/messages.js";

function skipReasonLabel(reason: SkippedInvite["reason"]) {
  switch (reason) {
    case "self":
      return m.onboarding_invite_skip_reason_self();
    case "already_member":
      return m.onboarding_invite_skip_reason_already_member();
    case "already_invited":
      return m.onboarding_invite_skip_reason_already_invited();
    case "duplicate":
      return m.onboarding_invite_skip_reason_duplicate();
  }
}

export function InviteForm() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState<string[]>([]);

  const sendMutation = useMutation({
    mutationFn: () => createInvites({ emails }),
    onSuccess: (result) => {
      if (result.sent > 0) {
        toast.add({
          type: "success",
          title: m.onboarding_invite_toast_sent_title(),
          description: m.onboarding_invite_toast_sent_description({ sentCount: result.sent }),
        });
      }

      for (const skipped of result.skippedInvites) {
        toast.add({
          type: "warning",
          title: m.onboarding_invite_toast_skipped_title(),
          description: `${skipped.email} — ${skipReasonLabel(skipped.reason)}`,
        });
      }

      if (result.warning) {
        toast.add({
          type: "warning",
          title: m.onboarding_invite_toast_warning(),
          description: result.warning,
        });
      }

      void navigate({ to: "/" });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error instanceof Error ? error.message : m.onboarding_invite_error(),
      });
    },
  });

  function goHome() {
    void navigate({ to: "/" });
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>{m.onboarding_invite_title()}</CardTitle>
        <CardDescription>{m.onboarding_invite_description()}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="invite-emails">{m.onboarding_invite_emails_label()}</FieldLabel>
            <TagInput
              id="invite-emails"
              value={emails}
              onChange={setEmails}
              max={10}
              disabled={sendMutation.isPending}
              placeholder={m.onboarding_invite_emails_placeholder()}
              removeLabel={m.onboarding_invite_remove_email()}
            />
            <FieldDescription>{m.onboarding_invite_emails_hint()}</FieldDescription>
          </Field>
          <Button
            type="button"
            disabled={sendMutation.isPending}
            onClick={() => {
              if (emails.length === 0) {
                goHome();
                return;
              }
              sendMutation.mutate();
            }}
          >
            {sendMutation.isPending
              ? m.onboarding_invite_sending_label()
              : m.onboarding_invite_continue_label()}
          </Button>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button type="button" variant="ghost" className="w-full" onClick={goHome} disabled={sendMutation.isPending}>
          {m.onboarding_invite_skip_label()}
        </Button>
      </CardFooter>
    </Card>
  );
}
