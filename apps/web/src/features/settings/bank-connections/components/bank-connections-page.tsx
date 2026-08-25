import { Badge } from "@floos/ui/components/badge";
import { Button } from "@floos/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@floos/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@floos/ui/components/empty";
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
import { Skeleton } from "@floos/ui/components/skeleton";
import { toast } from "@floos/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import { useEffect } from "react";

import { useBankConnections } from "@/features/banking/hooks/use-bank-connections";
import {
  connectionHealth,
  type ConnectionHealth,
} from "@/features/banking/lib/connection-health";
import { providerLabel, startBankReconnect } from "@/features/banking/services/api";
import type { BankConnectionListItem } from "@/features/banking/services/types";

const routeApi = getRouteApi("/_auth/_app/settings/bank-connections");

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

function ConnectionRow({
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
        ) : null}
      </ItemActions>
    </Item>
  );
}

export function BankConnectionsPage() {
  const { bankReconnected, bankError } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();
  const { connections, isPending, isError } = useBankConnections();

  const reconnect = useMutation({
    mutationFn: (connectionId: string) =>
      startBankReconnect(connectionId, "/settings/bank-connections"),
    onSuccess: (result) => {
      window.location.assign(result.redirectUrl);
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to start reconnect",
      });
    },
  });

  useEffect(() => {
    if (!bankReconnected && !bankError) return;

    if (bankError) {
      toast.add({ type: "error", title: bankError });
    } else {
      toast.add({ type: "success", title: "Bank reconnected — syncing transactions" });
      void queryClient.invalidateQueries({ queryKey: ["banking", "connections"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    }

    navigate({ search: {}, replace: true });
  }, [bankError, bankReconnected, navigate, queryClient]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank connections</CardTitle>
        <CardDescription>
          Open-banking links expire. Reconnect keeps the same accounts and transaction history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <ItemGroup>
            {Array.from({ length: 3 }, (_, index) => (
              <Item key={index} variant="outline">
                <ItemMedia variant="image">
                  <Skeleton className="size-full rounded-full" />
                </ItemMedia>
                <ItemContent>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        ) : null}

        {isError ? (
          <p className="text-sm text-destructive">Failed to load bank connections.</p>
        ) : null}

        {!isPending && !isError && connections.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>No banks connected</EmptyTitle>
              <EmptyDescription>
                Connect a bank during onboarding, then manage health and reconnect here.
              </EmptyDescription>
            </EmptyHeader>
            <Button nativeButton={false} render={<Link to="/onboarding" search={{ s: "connect-bank" }} />}>
              Connect a bank
            </Button>
          </Empty>
        ) : null}

        {connections.length > 0 ? (
          <ItemGroup>
            {connections.map((connection) => (
              <ConnectionRow
                key={connection.id}
                connection={connection}
                reconnectPending={reconnect.isPending && reconnect.variables === connection.id}
                onReconnect={(connectionId) => reconnect.mutate(connectionId)}
              />
            ))}
          </ItemGroup>
        ) : null}
      </CardContent>
    </Card>
  );
}
