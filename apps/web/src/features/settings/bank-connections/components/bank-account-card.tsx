import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@floos/ui/components/item";
import { Switch } from "@floos/ui/components/switch";
import { cn } from "@floos/ui/lib/utils";

import { useToggleBankAccount } from "@/features/banking/hooks/use-toggle-bank-account";
import type { BankConnectionListItem } from "@/features/banking/services/types";
import { formatAmount } from "@/lib/format";

type ConnectionAccount = BankConnectionListItem["accounts"][number];

function accountTypeLabel(type: ConnectionAccount["type"]) {
  switch (type) {
    case "depository":
      return "Depository";
    case "credit":
      return "Credit";
    case "loan":
      return "Loan";
    case "investment":
      return "Investment";
    case "other":
      return "Other";
  }
}

export function BankAccountCard({ account }: { account: ConnectionAccount }) {
  const toggle = useToggleBankAccount();

  return (
    <Item variant="muted" className={cn(!account.enabled && "opacity-60")}>
      <ItemMedia className="size-10 bg-muted text-xs font-semibold text-muted-foreground">
        {account.currency}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{account.name}</ItemTitle>
        <ItemDescription>{accountTypeLabel(account.type)}</ItemDescription>
        <p className="mt-2 font-medium font-mono text-xl tabular-nums">
          {formatAmount(account.balance, account.currency)}
        </p>
      </ItemContent>
      <ItemActions>
        <Switch
          checked={account.enabled}
          disabled={toggle.isPending}
          aria-label={account.name}
          onCheckedChange={(enabled) => {
            toggle.mutate({ id: account.id, enabled });
          }}
        />
      </ItemActions>
    </Item>
  );
}
