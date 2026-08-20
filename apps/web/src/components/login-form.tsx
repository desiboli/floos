import { Button } from "@floos/ui/components/button";
import { Icons } from "@floos/ui/components/icons";
import { Link } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export default function LoginForm() {
  return (
    <div className="w-full max-w-sm flex flex-col h-full">
      <div className="space-y-8 flex-1 flex flex-col justify-center">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-heading">Welcome to Floos</h2>
          <p className="text-sm text-muted-foreground">Sign in or create an account to continue</p>
        </div>
        <Button
          onClick={() => {
            authClient.signIn.social({
              provider: "google",
              callbackURL: "http://localhost:3001/",
            });
          }}
        >
          <Icons.google className="size-4" />
          Continue with Google
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        By signing in you agree to our{" "}
        <Link to="/terms" className="text-primary underline underline-offset-4 hover:no-underline">
          Terms of service
        </Link>{" "}
        &{" "}
        <Link to="/policy" className="text-primary underline underline-offset-4 hover:no-underline">
          Privacy policy
        </Link>
      </p>
    </div>
  );
}
