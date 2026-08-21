import { api } from "@/lib/api-client";

import type {
  DeleteExampleResult,
  ExampleResult,
  PatchExampleInput,
  PatchExampleResult,
  PutExampleInput,
  PutExampleResult,
} from "./types";

export async function getExample(): Promise<ExampleResult> {
  const res = await api.example.$get();
  if (!res.ok) throw new Error("Failed to fetch example");
  return res.json();
}

export async function putExample(id: string, input: PutExampleInput): Promise<PutExampleResult> {
  const res = await api.example[":id"].$put({ param: { id }, json: input });
  if (!res.ok) throw new Error("Failed to replace example");
  return res.json();
}

export async function patchExample(
  id: string,
  input: PatchExampleInput,
): Promise<PatchExampleResult> {
  const res = await api.example[":id"].$patch({ param: { id }, json: input });
  if (!res.ok) throw new Error("Failed to update example");
  return res.json();
}

export async function deleteExample(id: string): Promise<DeleteExampleResult> {
  const res = await api.example[":id"].$delete({ param: { id } });
  if (!res.ok) throw new Error("Failed to delete example");
  return res.json();
}
