import { Badge } from "@floos/ui/components/badge";
import { Button } from "@floos/ui/components/button";
import { Icons } from "@floos/ui/components/icons";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@floos/ui/components/item";

import {
  connectionHealth,
  type ConnectionHealth,
} from "@/features/banking/lib/connection-health";
import { providerLabel } from "@/features/banking/services/api";
import type { BankConnectionListItem } from "@/features/banking/services/types";

import { DeleteBankConnectionDialog } from "./delete-bank-connection-dialog";
import { SyncBankConnectionButton } from "./sync-bank-connection-button";

function statusBadge(health: ConnectionHealth) {
  if (health.kind === "disconnected") {
    return { label: "Disconnected", variant: "destructive" as const };
  }
  if (health.kind === "expired") {
    return { label: "Expired", variant: "destructive" as const };
  }
  if (health.kind === "expires-soon") {
    return {
      label: health.days === 1 ? "Expires in 1 day" : `Expires in ${health.days} days`,
      variant: "secondary" as const,
    };
  }
  return { label: "Connected", variant: "default" as const };
}

function formatLastSync(iso: string | null) {
  if (!iso) return "Never synced";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "Synced just now";
  if (minutes < 60) return `Synced ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Synced ${hours}h ago`;
  return `Synced ${Math.round(hours / 24)}d ago`;
}

export function BankConnectionHeader({
  connection,
  reconnectPending,
  onReconnect,
}: {
  connection: BankConnectionListItem;
  reconnectPending: boolean;
  onReconnect: (connectionId: string) => void;
}) {
  const health = connectionHealth(connection);
  const status = statusBadge(health);
  const enabledCount = connection.accounts.filter((account) => account.enabled).length;
  const initial = connection.name.charAt(0).toUpperCase();

  return (
    <Item variant="outline">
      <ItemMedia variant="image" className="bg-background [&_img]:object-contain rounded-full">
        {connection.logoUrl ? (
          <img src={connection.logoUrl} alt="" className="size-full" />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-xs font-semibold text-muted-foreground">
            {initial}
          </div>
        )}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {connection.name}
          <Badge variant={status.variant}>{status.label}</Badge>
        </ItemTitle>
        <ItemDescription>
          {providerLabel(connection.provider)}
          {enabledCount > 0 ? ` · ${enabledCount} account${enabledCount === 1 ? "" : "s"}` : ""}
          {` · ${formatLastSync(connection.lastSyncAt)}`}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        {health.kind !== "ok" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={reconnectPending}
            onClick={() => onReconnect(connection.id)}
          >
            {reconnectPending ? <Icons.loader className="size-4 animate-spin" /> : "Reconnect"}
          </Button>
        ) : (
          <SyncBankConnectionButton
            connectionId={connection.id}
            lastSyncAt={connection.lastSyncAt}
          />
        )}
        <DeleteBankConnectionDialog connection={connection} />
      </ItemActions>
    </Item>
  );
}
