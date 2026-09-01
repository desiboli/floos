import type { InferResponseType } from "hono/client";

import { api } from "@/lib/api-client";

export type AiSessionResult = InferResponseType<typeof api.ai.session.$get, 200>;

export class AiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function readError(res: Response) {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "Request failed";
}

export async function createAiSession(): Promise<AiSessionResult> {
  const res = await api.ai.session.$post();
  if (!res.ok) throw new AiApiError(await readError(res), res.status);
  return res.json();
}

export async function getAiSession(): Promise<AiSessionResult | null> {
  const res = await api.ai.session.$get();
  if (res.status === 404) return null;
  if (!res.ok) throw new AiApiError(await readError(res), res.status);
  return res.json();
}

export async function refreshAiToken(): Promise<{ publicAccessToken: string }> {
  const res = await api.ai.session.token.$post();
  if (!res.ok) throw new AiApiError(await readError(res), res.status);
  return res.json();
}

export async function resetAiSession(): Promise<AiSessionResult> {
  const res = await api.ai.session.reset.$post();
  if (!res.ok) throw new AiApiError(await readError(res), res.status);
  return res.json();
}
