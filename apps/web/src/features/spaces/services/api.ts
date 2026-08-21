import { api } from "@/lib/api-client";

import type { CreateSpaceInput, CreateSpaceResult } from "./types";

export async function createSpace(input: CreateSpaceInput): Promise<CreateSpaceResult> {
  const res = await api.spaces.$post({ json: input });
  if (!res.ok) throw new Error("Failed to create space");
  return res.json();
}
