import { Button } from "@floos/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@floos/ui/components/card";
import { Icons } from "@floos/ui/components/icons";
import Silk from "@floos/ui/components/silk";
import { toast } from "@floos/ui/components/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { acceptInvite, declineInvite } from "@/features/invites/services/api";
import { invitePreviewQueryOptions } from "@/features/invites/services/queries";
import { InviteActionError } from "@/features/invites/services/types";
import { authClient } from "@/lib/auth-client";
import { sanitizeInviteReturnTo } from "@/lib/sanitize-redirect";
import { m } from "@/paraglide/messages.js";

function statusCopy(status: string) {
  switch (status) {
    case "expired":
      return m.invite_landing_expired();
    case "revoked":
      return m.invite_landing_revoked();
    case "declined":
      return m.invite_landing_declined();
    case "accepted":
      return m.invite_landing_accepted();
    default:
      return m.invite_landing_error();
  }
}

function actionErrorCopy(error: InviteActionError) {
  switch (error.code) {
    case "email_mismatch":
      return m.invite_landing_email_mismatch();
    case "expired":
      return m.invite_landing_expired();
    case "revoked":
      return m.invite_landing_revoked();
    case "declined":
      return m.invite_landing_declined();
    case "accepted":
      return m.invite_landing_accepted();
    case "not_found":
      return m.invite_landing_unknown();
  }
}

export function InviteLanding({ token }: { token: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  const preview = useQuery(invitePreviewQueryOptions(token));

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvite(token),
    onSuccess: async () => {
      toast.add({ type: "success", title: m.invite_landing_accepted_toast() });
      await queryClient.invalidateQueries({ queryKey: ["spaces"] });
      await navigate({ to: "/" });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title:
          error instanceof InviteActionError
            ? actionErrorCopy(error)
            : m.invite_landing_error(),
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => declineInvite(token),
    onSuccess: async () => {
      toast.add({ type: "success", title: m.invite_landing_declined_toast() });
      await queryClient.invalidateQueries({ queryKey: ["invites", "preview", token] });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title:
          error instanceof InviteActionError
            ? actionErrorCopy(error)
            : m.invite_landing_error(),
      });
    },
  });

  const isBusy = acceptMutation.isPending || declineMutation.isPending;
  const previewError =
    preview.error instanceof InviteActionError ? preview.error : null;
  const invite = preview.data;
  const showHome =
    Boolean(previewError || preview.isError || (invite && invite.status !== "pending"));

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute top-4 left-4 z-10">
          <Icons.floos className="size-8 text-white" />
        </div>
        <div className="absolute inset-0 h-full w-full">
          <Silk speed={5} scale={1} color="#7B7481" noiseIntensity={1.5} rotation={0} />
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4 bg-muted dark:bg-background">
        <div className="flex justify-end gap-2">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Card className="w-full sm:max-w-md">
            {preview.isPending || session.isPending ? (
              <CardHeader>
                <CardTitle>{m.invite_landing_loading()}</CardTitle>
              </CardHeader>
            ) : previewError || preview.isError || !invite ? (
              <CardHeader>
                <CardTitle>{m.invite_landing_unknown()}</CardTitle>
                <CardDescription>{m.invite_landing_unknown_description()}</CardDescription>
              </CardHeader>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>
                    {m.invite_landing_title({
                      invitedByName: invite.invitedByName,
                      spaceName: invite.spaceName,
                    })}
                  </CardTitle>
                  <CardDescription>
                    {invite.status === "pending"
                      ? m.invite_landing_subtitle()
                      : statusCopy(invite.status)}
                  </CardDescription>
                </CardHeader>
                {invite.status === "pending" ? (
                  <CardContent>
                    {session.data ? (
                      <div className="flex flex-col gap-2">
                        <Button type="button" disabled={isBusy} onClick={() => acceptMutation.mutate()}>
                          {m.invite_landing_accept()}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() => declineMutation.mutate()}
                        >
                          {m.invite_landing_decline()}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => {
                          const invitePath = sanitizeInviteReturnTo(`/invite/${token}`);
                          if (!invitePath) return;

                          const origin = window.location.origin;
                          void authClient.signIn.social({
                            provider: "google",
                            callbackURL: `${origin}${invitePath}`,
                            newUserCallbackURL: `${origin}${invitePath}`,
                          });
                        }}
                      >
                        <Icons.google className="size-4" />
                        {m.invite_landing_sign_in()}
                      </Button>
                    )}
                  </CardContent>
                ) : null}
              </>
            )}
            {showHome ? (
              <CardFooter>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    void navigate({ to: "/" });
                  }}
                >
                  {m.invite_landing_go_home()}
                </Button>
              </CardFooter>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
