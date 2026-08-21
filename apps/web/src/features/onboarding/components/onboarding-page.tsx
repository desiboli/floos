import { Icons } from "@floos/ui/components/icons";
import Silk from "@floos/ui/components/silk";
import { getRouteApi } from "@tanstack/react-router";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";

import { CreateSpaceForm } from "./create-space-form";

const STEPS = ["create-space", "connect-bank", "select-accounts", "reconciliation"] as const;

const routeApi = getRouteApi("/_auth/onboarding/");

export function OnboardingPage() {
  const { s } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const goToStep = (step: (typeof STEPS)[number]) => {
    navigate({
      search: (prev) => ({ ...prev, s: step }),
    });
  };

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
      <div className="flex flex-col gap-4 p-4 bg-muted">
        <div className="flex justify-end gap-2">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
        <div className="flex flex-col gap-4 flex-1 items-center justify-center">
          {s === "create-space" && <CreateSpaceForm />}
        </div>
      </div>
    </div>
  );
}
