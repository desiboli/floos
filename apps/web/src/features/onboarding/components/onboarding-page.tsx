import { Button } from "@floos/ui/components/button";
import { Icons } from "@floos/ui/components/icons";
import Silk from "@floos/ui/components/silk";
import { toast } from "@floos/ui/components/toast";
import { getRouteApi } from "@tanstack/react-router";
import { useEffect } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { SelectSpaceDialog } from "@/features/spaces/components/select-space-dialog";
import { m } from "@/paraglide/messages.js";

import { ConnectBankForm } from "./connect-bank-form";
import { CreateSpaceForm } from "./create-space-form";
import { InviteForm } from "./invite-form";
import { SelectAccountsForm } from "./select-accounts-form";

const STEPS = ["create-space", "connect-bank", "select-accounts", "invite"] as const;

const routeApi = getRouteApi("/_auth/onboarding/");

export function OnboardingPage() {
  const { s, bankConnected, bankError, connectionId } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const goToStep = (step: (typeof STEPS)[number]) => {
    navigate({
      search: (prev) => ({ ...prev, s: step }),
    });
  };

  useEffect(() => {
    if (!bankConnected && !bankError) return;
    if (bankError) {
      toast.add({ type: "error", title: bankError });
      navigate({
        search: (prev) => {
          const { bankConnected: _c, bankError: _e, ...rest } = prev;
          return rest;
        },
        replace: true,
      });
      return;
    }
    if (bankConnected) {
      toast.add({ type: "success", title: "Bank authorized — choose accounts" });
      navigate({
        search: (prev) => {
          const { bankConnected: _c, bankError: _e, ...rest } = prev;
          return {
            ...rest,
            s: "select-accounts",
            connectionId: bankConnected,
          };
        },
        replace: true,
      });
    }
  }, [bankConnected, bankError, navigate]);

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
      <div className="flex flex-col gap-4 p-4 bg-muted dark:bg-background">
        <div className="flex justify-end gap-2">
          <SelectSpaceDialog />
          <LanguageSwitcher />
          <ModeToggle />
        </div>
        <div className="flex flex-col gap-4 flex-1 items-center justify-center">
          {s === "create-space" && <CreateSpaceForm />}
          {s === "connect-bank" && <ConnectBankForm />}
          {s === "select-accounts" && connectionId ? (
            <SelectAccountsForm connectionId={connectionId} />
          ) : null}
          {s === "select-accounts" && !connectionId ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {m.onboarding_select_accounts_missing_connection()}
              </p>
              <Button type="button" onClick={() => goToStep("connect-bank")}>
                {m.onboarding_connect_bank_connect_label()}
              </Button>
            </div>
          ) : null}
          {s === "invite" && <InviteForm />}
        </div>
      </div>
    </div>
  );
}
