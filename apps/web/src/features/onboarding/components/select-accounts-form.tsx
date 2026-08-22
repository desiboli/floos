import { Button } from "@floos/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@floos/ui/components/card";
import { FieldGroup } from "@floos/ui/components/field";
import { Icons } from "@floos/ui/components/icons";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@floos/ui/components/item";
import { ScrollArea } from "@floos/ui/components/scroll-area";
import { Skeleton } from "@floos/ui/components/skeleton";
import { Switch } from "@floos/ui/components/switch";
import { toast } from "@floos/ui/components/toast";
import { useMutation } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";

import type { ProviderAccount } from "@/features/banking/services/types";

import { commitBankAccounts } from "@/features/banking/services/api";
import { useProviderAccounts } from "@/features/banking/hooks/use-provider-accounts";
import { formatAmount, maskIban } from "@/lib/format";
import { m } from "@/paraglide/messages.js";

const routeApi = getRouteApi("/_auth/onboarding/");

function accountTypeLabel(type: ProviderAccount["type"]) {
  switch (type) {
    case "depository":
      return m.onboarding_select_accounts_type_depository();
    case "credit":
      return m.onboarding_select_accounts_type_credit();
    case "loan":
      return m.onboarding_select_accounts_type_loan();
    case "investment":
      return m.onboarding_select_accounts_type_investment();
    case "other":
      return m.onboarding_select_accounts_type_other();
  }
}

function AccountListSkeleton() {
  return Array.from({ length: 8 }, (_, i) => (
    <Item key={i} variant="muted">
      <ItemMedia>
        <Skeleton className="size-10" />
      </ItemMedia>
      <ItemContent>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </ItemContent>
      <ItemActions>
        <Skeleton className="h-4.5 w-8.25" />
      </ItemActions>
    </Item>
  ));
}

function AccountRow({
  account,
  enabled,
  disabled,
  onEnabledChange,
}: {
  account: ProviderAccount;
  enabled: boolean;
  disabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}) {
  const masked = maskIban(account.iban);
  const description = [
    accountTypeLabel(account.type),
    formatAmount(account.balance, account.currency),
    masked,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  return (
    <Item variant="muted">
      <ItemMedia className="size-10 bg-muted text-xs font-semibold text-muted-foreground">
        {account.currency}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{account.name}</ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Switch
          checked={enabled}
          disabled={disabled}
          aria-label={account.name}
          onCheckedChange={onEnabledChange}
        />
      </ItemActions>
    </Item>
  );
}

export function SelectAccountsForm({ connectionId }: { connectionId: string }) {
  const navigate = routeApi.useNavigate();
  const accountsQuery = useProviderAccounts(connectionId);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});

  const accounts = accountsQuery.data?.accounts ?? [];
  const enabledCount = accounts.filter(
    (account) => enabledMap[account.providerAccountId] ?? true,
  ).length;

  const commitMutation = useMutation({
    mutationFn: () =>
      commitBankAccounts(connectionId, {
        accounts: accounts.map((account) => ({
          ...account,
          enabled: enabledMap[account.providerAccountId] ?? true,
        })),
      }),
    onSuccess: (result) => {
      if (result.importStarted) {
        toast.add({
          type: "loading",
          title: m.onboarding_select_accounts_toast_importing_title(),
          description: m.onboarding_select_accounts_toast_importing_description(),
        });
      } else {
        toast.add({
          type: "warning",
          title: m.onboarding_select_accounts_toast_import_failed_title(),
          description: m.onboarding_select_accounts_toast_import_failed_description(),
        });
      }
      navigate({
        search: (prev) => ({ ...prev, s: "invite" }),
      });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error instanceof Error ? error.message : m.onboarding_select_accounts_error_load(),
      });
    },
  });

  const isBusy = commitMutation.isPending;
  const canContinue = !isBusy && accounts.length > 0 && enabledCount > 0;

  return (
    <Card className="w-full sm:max-w-lg">
      <CardHeader>
        <CardTitle>{m.onboarding_select_accounts_title()}</CardTitle>
        <CardDescription>{m.onboarding_select_accounts_description()}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <ScrollArea className="h-80">
            {accountsQuery.isPending ? (
              <ItemGroup className="gap-2">
                <AccountListSkeleton />
              </ItemGroup>
            ) : accountsQuery.isError ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <p className="text-center text-sm text-destructive">
                  {m.onboarding_select_accounts_error_load()}
                </p>
                <Button type="button" size="sm" variant="outline" onClick={() => accountsQuery.refetch()}>
                  {m.onboarding_select_accounts_try_again()}
                </Button>
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <p className="text-center text-sm text-muted-foreground">
                  {m.onboarding_select_accounts_empty()}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate({
                      search: (prev) => ({ ...prev, s: "connect-bank" }),
                    })
                  }
                >
                  {m.onboarding_connect_bank_connect_label()}
                </Button>
              </div>
            ) : (
              <ItemGroup className="gap-2">
                {accounts.map((account) => (
                  <AccountRow
                    key={account.providerAccountId}
                    account={account}
                    enabled={enabledMap[account.providerAccountId] ?? true}
                    disabled={isBusy}
                    onEnabledChange={(enabled) => {
                      setEnabledMap((prev) => ({
                        ...prev,
                        [account.providerAccountId]: enabled,
                      }));
                    }}
                  />
                ))}
              </ItemGroup>
            )}
          </ScrollArea>
        </FieldGroup>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {m.onboarding_select_accounts_n_of_m({
            enabledCount,
            totalCount: accounts.length,
          })}
        </p>
        <Button
          type="button"
          disabled={!canContinue}
          onClick={() => commitMutation.mutate()}
        >
          {isBusy ? <Icons.loader data-icon="inline-start" className="animate-spin" /> : null}
          {isBusy
            ? m.onboarding_select_accounts_saving_label()
            : m.onboarding_select_accounts_continue_label()}
        </Button>
      </CardFooter>
    </Card>
  );
}
