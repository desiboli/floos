import { api } from "@/lib/api-client";

import type { CreateBankLinkInput, CreateBankLinkResult } from "./types";

export async function createBankLink(input: CreateBankLinkInput): Promise<CreateBankLinkResult> {
  const res = await api.banking.link.$post({ json: input });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to start bank connection");
  }

  return res.json();
}

export function providerLabel(provider: "gocardless" | "enablebanking") {
  return provider === "gocardless" ? "GoCardless" : "Enable Banking";
}
