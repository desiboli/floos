import { Icons } from "@floos/ui/components/icons";
import Silk from "@floos/ui/components/silk";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import LoginForm from "@/components/login-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute top-4 left-4 z-10">
          <a href="#" className="flex items-center gap-2 font-medium text-white">
            <Icons.floos className="size-6" />
            Floos
          </a>
        </div>
        <div className="absolute inset-0 h-full w-full">
          <Silk speed={5} scale={1} color="#7B7481" noiseIntensity={1.5} rotation={0} />
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center">
          {/* <div className="w-full max-w-xs"> */}
          <LoginForm />
          {/* {showSignIn ? (
              <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
            ) : (
              <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
            )} */}
          {/* </div> */}
        </div>
      </div>
    </div>
  );
}
