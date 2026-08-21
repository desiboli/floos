import { Icons } from "@floos/ui/components/icons";
import Silk from "@floos/ui/components/silk";
import { Link } from "@tanstack/react-router";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { m } from "@/paraglide/messages.js";

import LoginForm from "./login-form";

export function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute top-4 left-4 z-10">
          <a href="#" className="flex items-center gap-2 font-medium text-white">
            <Icons.floos className="size-8" />
          </a>
        </div>
        <div className="absolute inset-0 h-full w-full">
          <Silk speed={5} scale={1} color="#7B7481" noiseIntensity={1.5} rotation={0} />
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex justify-end gap-2">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
        <div className="flex flex-col gap-4 flex-1 items-center justify-center">
          <LoginForm />
        </div>

        <p className="text-sm text-muted-foreground text-center my-4">
          {m.login_terms_of_service_text()}{" "}
          <Link
            to="/terms"
            className="text-primary underline underline-offset-4 hover:no-underline"
          >
            {m.login_terms_of_service_link()}
          </Link>{" "}
          &{" "}
          <Link
            to="/policy"
            className="text-primary underline underline-offset-4 hover:no-underline"
          >
            {m.login_privacy_policy_link()}
          </Link>
        </p>
      </div>
    </div>
  );
}
