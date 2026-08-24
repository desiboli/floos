import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useUserSpaces } from "@/features/spaces/hooks/use-user-spaces";

import { updateTransactionCategory } from "../services/api";

export function useUpdateTransactionCategory() {
  const queryClient = useQueryClient();
  const { activeSpaceId } = useUserSpaces();

  return useMutation({
    mutationFn: ({ id, categorySlug }: { id: string; categorySlug: string }) =>
      updateTransactionCategory(id, categorySlug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["transactions", activeSpaceId],
      });
    },
  });
}
