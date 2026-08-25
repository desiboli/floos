import { toast } from "@floos/ui/components/toast";
import { useMutation } from "@tanstack/react-query";

import { startBankReconnect } from "../services/api";

export function useReconnectBankConnection(origin: string) {
  return useMutation({
    mutationFn: (connectionId: string) => startBankReconnect(connectionId, origin),
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
}
