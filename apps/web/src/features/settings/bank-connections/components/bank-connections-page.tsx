import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@floos/ui/components/card";
import { toast } from "@floos/ui/components/toast";
import { useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useEffect } from "react";

import { useBankConnections } from "@/features/banking/hooks/use-bank-connections";
import { useReconnectBankConnection } from "@/features/banking/hooks/use-reconnect-bank-connection";

import { BankConnectionBlock } from "./bank-connection-block";
import { BankConnectionsEmpty } from "./bank-connections-empty";
import { BankConnectionsPageSkeleton } from "./bank-connections-page-skeleton";

const routeApi = getRouteApi("/_auth/_app/settings/bank-connections");

export function BankConnectionsPage() {
  const { bankReconnected, bankError } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();
  const { connections, isPending, isError } = useBankConnections();
  const reconnect = useReconnectBankConnection("/settings/bank-connections");

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
      </CardHeader>
      <CardContent>
        {isPending ? <BankConnectionsPageSkeleton /> : null}

        {isError ? (
          <p className="text-sm text-destructive">Failed to load bank connections.</p>
        ) : null}

        {!isPending && !isError && connections.length === 0 ? <BankConnectionsEmpty /> : null}

        {connections.length > 0 ? (
          <div className="flex flex-col gap-4">
            {connections.map((connection) => (
              <BankConnectionBlock
                key={connection.id}
                connection={connection}
                reconnectPending={reconnect.isPending && reconnect.variables === connection.id}
                onReconnect={(connectionId) => reconnect.mutate(connectionId)}
              />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
