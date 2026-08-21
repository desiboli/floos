import { api } from "@/lib/api-client";

import type {
  ActiveSpaceResult,
  CreateSpaceInput,
  CreateSpaceResult,
  SetActiveInput,
  SetActiveResult,
  SpacesResult,
} from "./types";

export async function createSpace(input: CreateSpaceInput): Promise<CreateSpaceResult> {
  const res = await api.spaces.$post({ json: input });
  if (!res.ok) throw new Error("Failed to create space");
  return res.json();
}

export async function getSpaces(): Promise<SpacesResult> {
  const res = await api.spaces.$get();
  if (!res.ok) throw new Error("Failed to fetch spaces");
  return res.json();
}

export async function getActiveSpace(): Promise<ActiveSpaceResult> {
  const res = await api.spaces.active.$get();
  if (!res.ok) throw new Error("Failed to fetch active space");
  return res.json();
}

export async function setActiveSpace(input: SetActiveInput): Promise<SetActiveResult> {
  const res = await api.spaces.active.$post({ json: input });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to switch space");
  }
  return res.json();
}
