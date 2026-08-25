import { toast } from "@floos/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteBankConnection } from "../services/api";

export function useDeleteBankConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBankConnection,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["banking", "connections"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
      toast.add({ type: "success", title: "Bank connection deleted" });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to delete bank connection",
      });
    },
  });
}
