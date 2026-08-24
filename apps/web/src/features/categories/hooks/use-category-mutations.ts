import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@floos/ui/components/toast";

import { useUserSpaces } from "@/features/spaces/hooks/use-user-spaces";

import { createCategory, deleteCategory, updateCategory } from "../services/api";

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  const { activeSpaceId } = useUserSpaces();

  return () =>
    queryClient.invalidateQueries({
      queryKey: ["categories", activeSpaceId],
    });
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      await invalidate();
      toast.add({ type: "success", title: "Category created" });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to create category",
      });
    },
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      parentId?: string;
      description?: string | null;
      color?: string | null;
    }) => updateCategory(id, input),
    onSuccess: async () => {
      await invalidate();
      toast.add({ type: "success", title: "Category updated" });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to update category",
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { activeSpaceId } = useUserSpaces();
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({
          queryKey: ["transactions", activeSpaceId],
        }),
      ]);
      toast.add({ type: "success", title: "Category deleted" });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to delete category",
      });
    },
  });
}
