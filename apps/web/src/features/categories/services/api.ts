import { api } from "@/lib/api-client";

export async function getCategories() {
  const res = await api.categories.$get();

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to fetch categories");
  }

  return res.json();
}

export async function createCategory(input: {
  name: string;
  parentId: string;
  description?: string;
  color?: string;
}) {
  const res = await api.categories.$post({ json: input });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to create category");
  }

  return res.json();
}

export async function updateCategory(
  id: string,
  input: {
    name?: string;
    parentId?: string;
    description?: string | null;
    color?: string | null;
  },
) {
  const res = await api.categories[":id"].$patch({
    param: { id },
    json: input,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to update category");
  }

  return res.json();
}

export async function deleteCategory(id: string) {
  const res = await api.categories[":id"].$delete({ param: { id } });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to delete category");
  }
}
