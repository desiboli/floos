import { Button } from "@floos/ui/components/button";
import { Icons } from "@floos/ui/components/icons";

import { authClient } from "@/lib/auth-client";
import { m } from "@/paraglide/messages.js";

export default function LoginForm() {
  return (
    <div className="w-full max-w-sm flex flex-col h-full">
      <div className="space-y-8 flex-1 flex flex-col justify-center">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-heading">{m.login_title()}</h2>
          <p className="text-sm text-muted-foreground">{m.login_subtitle()}</p>
        </div>
        <Button
          onClick={() => {
            authClient.signIn.social({
              provider: "google",
              callbackURL: `${window.location.origin}/`,
              newUserCallbackURL: `${window.location.origin}/onboarding?s=create-space`,
            });
          }}
        >
          <Icons.google className="size-4" />
          {m.login_button_google()}
        </Button>
      </div>
    </div>
  );
}
