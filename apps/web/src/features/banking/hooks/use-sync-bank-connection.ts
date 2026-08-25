import { toast } from "@floos/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { syncBankConnection } from "../services/api";

export function useSyncBankConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncBankConnection,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["banking", "connections"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
      toast.add({ type: "success", title: "Fetching latest transactions" });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to sync bank connection",
      });
    },
  });
}
