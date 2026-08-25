import { toast } from "@floos/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toggleBankAccount } from "../services/api";
import type { ListConnectionsResult } from "../services/types";

const CONNECTIONS_QUERY_KEY = ["banking", "connections"] as const;

export function useToggleBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      toggleBankAccount(id, enabled),
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: CONNECTIONS_QUERY_KEY });

      const previous = queryClient.getQueriesData<ListConnectionsResult>({
        queryKey: CONNECTIONS_QUERY_KEY,
      });

      queryClient.setQueriesData<ListConnectionsResult>(
        { queryKey: CONNECTIONS_QUERY_KEY },
        (current) => {
          if (!current) return current;
          return {
            ...current,
            connections: current.connections.map((connection) => ({
              ...connection,
              accounts: connection.accounts.map((account) =>
                account.id === id ? { ...account, enabled } : account,
              ),
            })),
          };
        },
      );

      return { previous };
    },
    onError: (error, _variables, context) => {
      for (const [key, data] of context?.previous ?? []) {
        queryClient.setQueryData(key, data);
      }
      toast.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to update account",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
    },
  });
}
