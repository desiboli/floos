import { api } from "@/lib/api-client";

import type {
  CommitAccountsInput,
  CommitAccountsResult,
  ConnectionTransactionsResult,
  CreateBankLinkInput,
  CreateBankLinkResult,
  DeleteBankConnectionResult,
  ListConnectionsResult,
  ProviderAccountsResult,
  ReconnectLinkResult,
  SyncConnectionResult,
  ToggleBankAccountResult,
} from "./types";

export async function createBankLink(input: CreateBankLinkInput): Promise<CreateBankLinkResult> {
  const res = await api.banking.link.$post({ json: input });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to start bank connection");
  }

  return res.json();
}

export async function listBankConnections(): Promise<ListConnectionsResult> {
  const res = await api.banking.connections.$get();

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to load bank connections");
  }

  return res.json();
}

export async function startBankReconnect(
  connectionId: string,
  origin: string,
): Promise<ReconnectLinkResult> {
  const res = await api.banking.connections[":id"].reconnect.$post({
    param: { id: connectionId },
    json: { origin },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to start bank reconnect");
  }

  return res.json();
}

export async function deleteBankConnection(id: string): Promise<DeleteBankConnectionResult> {
  const res = await api.banking.connections[":id"].$delete({
    param: { id },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to delete bank connection");
  }

  return res.json();
}

export async function getProviderAccounts(connectionId: string): Promise<ProviderAccountsResult> {
  const res = await api.banking.connections[":id"]["provider-accounts"].$get({
    param: { id: connectionId },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to fetch provider accounts");
  }

  return res.json();
}

export async function commitBankAccounts(
  connectionId: string,
  input: CommitAccountsInput,
): Promise<CommitAccountsResult> {
  const res = await api.banking.connections[":id"].accounts.$post({
    param: { id: connectionId },
    json: input,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to save accounts");
  }

  return res.json();
}

export async function toggleBankAccount(
  id: string,
  enabled: boolean,
): Promise<ToggleBankAccountResult> {
  const res = await api.banking.accounts[":id"].$patch({
    param: { id },
    json: { enabled },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to update account");
  }

  return res.json();
}

export async function getConnectionTransactions(
  connectionId: string,
): Promise<ConnectionTransactionsResult> {
  const res = await api.banking.connections[":id"].transactions.$get({
    param: { id: connectionId },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to fetch transactions");
  }

  return res.json();
}

export async function syncBankConnection(connectionId: string): Promise<SyncConnectionResult> {
  const res = await api.banking.connections[":id"].sync.$post({
    param: { id: connectionId },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to queue connection sync");
  }

  return res.json();
}

export function providerLabel(provider: "gocardless" | "enablebanking") {
  return provider === "gocardless" ? "GoCardless" : "Enable Banking";
}
