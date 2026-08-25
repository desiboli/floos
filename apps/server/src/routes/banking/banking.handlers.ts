import { auth } from "@floos/auth";
import { Provider } from "@floos/banking";
import { db } from "@floos/db";
import {
  createBankAccounts,
  createBankConnection,
  deleteBankConnection,
  deletePendingBankConnection,
  getActiveSpaceId,
  getBankConnectionByInstitution,
  getInstitutionById,
  updateBankConnectionLink,
  getBankConnectionById,
  getEnabledBankAccountsByConnection,
  listBankAccountsBySpace,
  listBankConnectionsBySpace,
  listBankTransactionsByConnection,
  updateBankAccountEnabled,
  updateBankConnectionStatus,
} from "@floos/db/queries";
import { env } from "@floos/env/server";
import type {
  deleteConnection as deleteConnectionTask,
  reconnectConnection,
  syncConnectionTransactions,
} from "@floos/jobs";
import { generateCronTag } from "@floos/jobs/generate-cron-tag";
import { schedules, tasks } from "@trigger.dev/sdk";

import type { AppRouteHandler } from "../../lib/types";
import type {
  CallbackRoute,
  CommitAccountsRoute,
  CreateLinkRoute,
  DeleteConnectionRoute,
  ListConnectionTransactionsRoute,
  ListConnectionsRoute,
  ListProviderAccountsRoute,
  ReconnectLinkRoute,
  SyncConnectionRoute,
  ToggleBankAccountRoute,
} from "./banking.routes";

import * as HTTPStatusCodes from "../../http-status-codes";

function getBankingCallbackUrl() {
  return new URL("/banking/callback", env.BETTER_AUTH_URL).toString();
}

function encodeCallbackState(connectionId: string, origin: string, reconnect = false) {
  const encodedOrigin = Buffer.from(origin, "utf8").toString("base64url");
  return reconnect ? `${connectionId}.${encodedOrigin}.reconnect` : `${connectionId}.${encodedOrigin}`;
}

function parseCallbackState(stateRaw: string) {
  const [connectionId = "", encodedOrigin = "", flag = ""] = stateRaw.split(".");
  const decoded = encodedOrigin ? Buffer.from(encodedOrigin, "base64url").toString("utf8") : "/";
  const origin = decoded.startsWith("/") ? decoded : "/";
  return { connectionId, origin, isReconnect: flag === "reconnect" };
}

function buildWebRedirect(origin: string, extra: Record<string, string>) {
  const safeOrigin = origin.startsWith("/") ? origin : "/";
  const url = new URL(safeOrigin, env.CORS_ORIGIN);
  for (const [key, value] of Object.entries(extra)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

type CatalogInstitution = {
  id: string;
  name: string;
  provider: "gocardless" | "enablebanking";
  countries: string[];
  availableHistory: number | null;
  psuType: string | null;
};

async function startProviderAuth(
  institution: CatalogInstitution,
  connectionId: string,
  origin: string,
  reconnect = false,
) {
  const provider = new Provider({ provider: institution.provider });
  return provider.createLink({
    institutionId: institution.id,
    redirect: getBankingCallbackUrl(),
    reference: encodeCallbackState(connectionId, origin, reconnect),
    institutionName: institution.name,
    psuType: institution.psuType ?? undefined,
    countryCode: institution.countries[0],
    transactionTotalDays: institution.availableHistory ?? undefined,
  });
}

export const createLink: AppRouteHandler<CreateLinkRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const { institutionId, origin } = c.req.valid("json");

  const institution = await getInstitutionById(db, institutionId);

  if (!institution) {
    return c.json({ error: "Institution not found" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const existing = await getBankConnectionByInstitution(db, activeSpaceId, institutionId);

  if (existing?.status === "connected") {
    return c.json({ error: "This bank is already connected" }, HTTPStatusCodes.BAD_REQUEST);
  }

  if (existing?.status === "disconnected") {
    return c.json(
      { error: "This bank is disconnected. Reconnect it instead." },
      HTTPStatusCodes.BAD_REQUEST,
    );
  }

  await deletePendingBankConnection(db, activeSpaceId, institutionId);

  const connection = await createBankConnection(db, {
    spaceId: activeSpaceId,
    institutionId,
    provider: institution.provider,
    name: institution.name,
    logoUrl: institution.logo,
    accessToken: null,
    referenceId: null,
  });

  try {
    const link = await startProviderAuth(institution, connection.id, origin);

    await updateBankConnectionLink(db, connection.id, {
      accessToken: link.ref,
      referenceId: link.ref,
      expiresAt: link.expiresAt,
    });

    return c.json({ redirectUrl: link.url, connectionId: connection.id }, HTTPStatusCodes.OK);
  } catch (err) {
    await deleteBankConnection(db, connection.id, activeSpaceId);
    const message = err instanceof Error ? err.message : "Failed to create bank link";
    return c.json({ error: message }, HTTPStatusCodes.BAD_REQUEST);
  }
};

export const callback: AppRouteHandler<CallbackRoute> = async (c) => {
  const query = c.req.valid("query");
  const stateRaw = query.state ?? query.ref ?? "";
  const { connectionId, origin, isReconnect } = parseCallbackState(stateRaw);
  const back = (extra: Record<string, string>) => c.redirect(buildWebRedirect(origin, extra));

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const user = session?.user;

  if (!user) {
    return back({ bankError: "Not authenticated" });
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return back({ bankError: "No active space" });
  }

  const connection = await getBankConnectionById(db, connectionId, activeSpaceId);

  if (!connection) {
    return back({ bankError: "Connection not found" });
  }

  if (query.error) {
    const message = query.error_description ?? query.error;
    if (!isReconnect) {
      await deleteBankConnection(db, connection.id, activeSpaceId).catch(() => undefined);
    }
    return back({ bankError: message });
  }

  const enableBankingCode = connection.provider === "enablebanking" ? query.code : undefined;

  // Enable Banking success always includes `code`. Missing it means the user cancelled.
  if (connection.provider === "enablebanking" && !enableBankingCode) {
    if (!isReconnect) {
      await deleteBankConnection(db, connection.id, activeSpaceId).catch(() => undefined);
    }
    return back({});
  }

  try {
    if (enableBankingCode) {
      const provider = new Provider({ provider: "enablebanking" });
      const { sessionId, expiresAt } = await provider.exchangeCode!({ code: enableBankingCode });

      await updateBankConnectionLink(db, connection.id, {
        accessToken: sessionId,
        referenceId: sessionId,
        expiresAt: expiresAt ?? connection.expiresAt?.toISOString() ?? null,
      });
    }

    if (connection.provider === "gocardless") {
      const requisitionId = isReconnect
        ? connection.referenceId
        : (connection.accessToken ?? connection.referenceId);

      if (!requisitionId) {
        throw new Error("Missing GoCardless requisition id");
      }

      const provider = new Provider({ provider: "gocardless" });
      const { status } = await provider.getConnectionStatus({ id: requisitionId });

      if (status !== "connected") {
        throw new Error("Bank authorization was not completed");
      }

      if (isReconnect) {
        const expiresAt = (await provider.getExpiresAt?.({ id: requisitionId })) ?? null;
        await updateBankConnectionLink(db, connection.id, {
          accessToken: requisitionId,
          referenceId: requisitionId,
          ...(expiresAt ? { expiresAt } : {}),
        });
      }
    }

    if (isReconnect) {
      await updateBankConnectionStatus(db, connection.id, activeSpaceId, "connected");
      try {
        await tasks.trigger<typeof reconnectConnection>("reconnect-connection", {
          connectionId: connection.id,
        });
      } catch (err) {
        c.get("log").error(
          err instanceof Error ? err : new Error("Failed to enqueue reconnect sync"),
        );
      }
      return back({ bankReconnected: connection.id });
    }

    return back({ bankConnected: connection.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to complete bank connection";
    if (!isReconnect) {
      await deleteBankConnection(db, connection.id, activeSpaceId).catch(() => undefined);
    }
    return back({ bankError: message });
  }
};

export const reconnectLink: AppRouteHandler<ReconnectLinkRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const { id } = c.req.valid("param");
  const { origin } = c.req.valid("json");
  const connection = await getBankConnectionById(db, id, activeSpaceId);

  if (!connection) {
    return c.json({ error: "Connection not found" }, HTTPStatusCodes.NOT_FOUND);
  }

  if (connection.status === "pending") {
    return c.json(
      { error: "Finish connecting this bank before reconnecting" },
      HTTPStatusCodes.BAD_REQUEST,
    );
  }

  const institution = await getInstitutionById(db, connection.institutionId);

  if (!institution) {
    return c.json({ error: "Institution not found" }, HTTPStatusCodes.BAD_REQUEST);
  }

  try {
    const link = await startProviderAuth(institution, connection.id, origin, true);

    // GoCardless callback needs the new requisition id. Live accessToken and
    // expiresAt stay until the bank returns. Enable Banking does not touch the
    // row until the callback exchanges `code`.
    if (institution.provider === "gocardless") {
      await updateBankConnectionLink(db, connection.id, {
        referenceId: link.ref,
      });
    }

    return c.json({ redirectUrl: link.url, connectionId: connection.id }, HTTPStatusCodes.OK);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start bank reconnect";
    return c.json({ error: message }, HTTPStatusCodes.BAD_REQUEST);
  }
};

export const deleteConnection: AppRouteHandler<DeleteConnectionRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const { id } = c.req.valid("param");
  const connection = await getBankConnectionById(db, id, activeSpaceId);

  if (!connection) {
    return c.json({ error: "Connection not found" }, HTTPStatusCodes.NOT_FOUND);
  }

  const sessionId = connection.accessToken ?? connection.referenceId;
  const { provider } = connection;

  await deleteBankConnection(db, id, activeSpaceId);

  let queued = false;

  if (sessionId) {
    try {
      await tasks.trigger<typeof deleteConnectionTask>("delete-connection", {
        provider,
        sessionId,
      });
      queued = true;
    } catch (err) {
      c.get("log").error(
        err instanceof Error ? err : new Error("Failed to enqueue connection revoke"),
      );
    }
  }

  return c.json({ id: connection.id, queued }, HTTPStatusCodes.OK);
};

export const listConnections: AppRouteHandler<ListConnectionsRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const [connections, accounts] = await Promise.all([
    listBankConnectionsBySpace(db, activeSpaceId),
    listBankAccountsBySpace(db, activeSpaceId),
  ]);

  const accountsByConnection = new Map<string, typeof accounts>();
  for (const account of accounts) {
    if (!account.bankConnectionId) continue;
    const bucket = accountsByConnection.get(account.bankConnectionId) ?? [];
    bucket.push(account);
    accountsByConnection.set(account.bankConnectionId, bucket);
  }

  return c.json(
    {
      connections: connections.map((connection) => ({
        id: connection.id,
        name: connection.name,
        logoUrl: connection.logoUrl,
        provider: connection.provider,
        status: connection.status === "disconnected" ? ("disconnected" as const) : ("connected" as const),
        expiresAt: connection.expiresAt?.toISOString() ?? null,
        lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
        accounts: (accountsByConnection.get(connection.id) ?? []).map((account) => {
          const balance = Number(account.balance);
          return {
            id: account.id,
            name: account.name,
            type: account.type,
            currency: account.currency,
            balance: Number.isFinite(balance) ? balance : 0,
            enabled: account.enabled,
          };
        }),
      })),
    },
    HTTPStatusCodes.OK,
  );
};

export const listProviderAccounts: AppRouteHandler<ListProviderAccountsRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const { id } = c.req.valid("param");
  const connection = await getBankConnectionById(db, id, activeSpaceId);

  if (!connection) {
    return c.json({ error: "Connection not found" }, HTTPStatusCodes.NOT_FOUND);
  }

  if (connection.status === "disconnected") {
    return c.json({ error: "Connection is disconnected" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const providerId = connection.accessToken ?? connection.referenceId;

  if (!providerId) {
    return c.json({ error: "Connection has no access token" }, HTTPStatusCodes.BAD_REQUEST);
  }

  try {
    const provider = new Provider({ provider: connection.provider });
    const accounts = await provider.getAccounts({ id: providerId });
    const sorted = accounts.toSorted((a, b) => b.balance - a.balance);

    return c.json(
      {
        accounts: sorted.map((account) => ({
          providerAccountId: account.id,
          name: account.name,
          type: account.type,
          currency: account.currency,
          balance: account.balance,
          availableBalance: account.availableBalance,
          creditLimit: account.creditLimit,
          iban: account.iban,
          bic: account.bic,
        })),
      },
      HTTPStatusCodes.OK,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch accounts";
    c.get("log").error(err instanceof Error ? err : new Error(message));
    return c.json({ error: message }, HTTPStatusCodes.BAD_REQUEST);
  }
};

export const commitAccounts: AppRouteHandler<CommitAccountsRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const { id } = c.req.valid("param");
  const { accounts } = c.req.valid("json");
  const connection = await getBankConnectionById(db, id, activeSpaceId);

  if (!connection) {
    return c.json({ error: "Connection not found" }, HTTPStatusCodes.NOT_FOUND);
  }

  if (connection.status !== "pending") {
    return c.json({ error: "Connection is not pending" }, HTTPStatusCodes.BAD_REQUEST);
  }

  if (!accounts.some((account) => account.enabled)) {
    return c.json({ error: "At least one account must be enabled" }, HTTPStatusCodes.BAD_REQUEST);
  }

  try {
    const dbAccounts = await createBankAccounts(
      db,
      accounts.map((account) => ({
        spaceId: activeSpaceId,
        bankConnectionId: connection.id,
        accountId: account.providerAccountId,
        name: account.name,
        type: account.type,
        currency: account.currency,
        balance: String(account.balance),
        availableBalance: account.availableBalance != null ? String(account.availableBalance) : null,
        creditLimit: account.creditLimit != null ? String(account.creditLimit) : null,
        iban: account.iban,
        bic: account.bic,
        enabled: account.enabled,
        isManual: false,
      })),
    );

    await updateBankConnectionStatus(db, connection.id, activeSpaceId, "connected");

    const enabledCount = accounts.filter((account) => account.enabled).length;
    let importStarted = false;

    try {
      await tasks.trigger<typeof syncConnectionTransactions>("sync-connection-transactions", {
        connectionId: connection.id,
        manualSync: true,
      });
      importStarted = true;
    } catch (err) {
      c.get("log").error(err instanceof Error ? err : new Error("Failed to enqueue transaction sync"));
    }

    if (connection.provider === "gocardless") {
      try {
        await tasks.trigger<typeof syncConnectionTransactions>(
          "sync-connection-transactions",
          { connectionId: connection.id, manualSync: true },
          { delay: "5m" },
        );
      } catch (err) {
        c.get("log").error(
          err instanceof Error ? err : new Error("Failed to enqueue delayed GoCardless sync"),
        );
      }
    }

    try {
      await schedules.create({
        task: "bank-sync-scheduler",
        cron: generateCronTag(activeSpaceId),
        timezone: "UTC",
        externalId: activeSpaceId,
        deduplicationKey: `${activeSpaceId}-bank-sync-scheduler`,
      });
    } catch (err) {
      c.get("log").error(
        err instanceof Error ? err : new Error("Failed to create bank sync schedule"),
      );
    }

    return c.json({ count: dbAccounts.length, enabledCount, importStarted }, HTTPStatusCodes.OK);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to persist accounts";
    return c.json({ error: message }, HTTPStatusCodes.BAD_REQUEST);
  }
};

function connectionSyncStatus(
  connection: { status: string; lastSyncAt: Date | null },
  enabledAccountCount: number,
): "syncing" | "ready" | "error" {
  if (connection.lastSyncAt) return "ready";
  if (connection.status === "connected" && enabledAccountCount > 0) return "syncing";
  return "error";
}

export const listConnectionTransactions: AppRouteHandler<ListConnectionTransactionsRoute> = async (
  c,
) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const { id } = c.req.valid("param");
  const connection = await getBankConnectionById(db, id, activeSpaceId);

  if (!connection) {
    return c.json({ error: "Connection not found" }, HTTPStatusCodes.NOT_FOUND);
  }

  const [rows, enabledAccounts] = await Promise.all([
    listBankTransactionsByConnection(db, {
      spaceId: activeSpaceId,
      connectionId: connection.id,
      limit: 100,
    }),
    getEnabledBankAccountsByConnection(db, connection.id),
  ]);

  return c.json(
    {
      status: connectionSyncStatus(connection, enabledAccounts.length),
      lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
      transactions: rows.map((row) => ({
        id: row.id,
        date: row.date,
        amount: Number(row.amount),
        currency: row.currency,
        name: row.name,
        description: row.description,
        status: row.status === "pending" ? ("pending" as const) : ("posted" as const),
        method: row.method,
        counterpartyName: row.counterpartyName,
        merchantName: row.merchantName,
        balance: row.balance != null ? Number(row.balance) : null,
        currencyRate: row.currencyRate != null ? Number(row.currencyRate) : null,
        currencySource: row.currencySource,
      })),
    },
    HTTPStatusCodes.OK,
  );
};

export const toggleBankAccount: AppRouteHandler<ToggleBankAccountRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const { id } = c.req.valid("param");
  const { enabled } = c.req.valid("json");
  const updated = await updateBankAccountEnabled(db, { id, spaceId: activeSpaceId, enabled });

  if (!updated) {
    return c.json({ error: "Account not found" }, HTTPStatusCodes.NOT_FOUND);
  }

  return c.json({ id: updated.id, enabled: updated.enabled }, HTTPStatusCodes.OK);
};

export const syncConnection: AppRouteHandler<SyncConnectionRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const { id } = c.req.valid("param");
  const connection = await getBankConnectionById(db, id, activeSpaceId);

  if (!connection) {
    return c.json({ error: "Connection not found" }, HTTPStatusCodes.NOT_FOUND);
  }

  if (connection.status !== "connected") {
    return c.json({ error: "Connection is not connected" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const handle = await tasks.trigger<typeof syncConnectionTransactions>(
    "sync-connection-transactions",
    { connectionId: connection.id, manualSync: true },
  );

  return c.json({ queued: true as const, runId: handle.id }, HTTPStatusCodes.ACCEPTED);
};
