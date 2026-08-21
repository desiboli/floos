import { auth } from "@floos/auth";
import { Provider } from "@floos/banking";
import { db } from "@floos/db";
import {
  createBankConnection,
  deleteBankConnection,
  deletePendingBankConnection,
  getActiveSpaceId,
  getBankConnectionByInstitution,
  getInstitutionById,
  updateBankConnectionLink,
  getBankConnectionById,
} from "@floos/db/queries";
import { env } from "@floos/env/server";

import type { AppRouteHandler } from "../../lib/types";
import type { CallbackRoute, CreateLinkRoute } from "./banking.routes";

import * as HTTPStatusCodes from "../../http-status-codes";

function getBankingCallbackUrl() {
  return new URL("/banking/callback", env.BETTER_AUTH_URL).toString();
}

function buildWebRedirect(origin: string, extra: Record<string, string>) {
  const safeOrigin = origin.startsWith("/") ? origin : "/";
  const url = new URL(safeOrigin, env.CORS_ORIGIN);
  for (const [key, value] of Object.entries(extra)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
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

  const encodedOrigin = Buffer.from(origin, "utf8").toString("base64url");
  const stateToken = `${connection.id}.${encodedOrigin}`;

  try {
    const provider = new Provider({ provider: institution.provider });
    const link = await provider.createLink({
      institutionId,
      redirect: getBankingCallbackUrl(),
      reference: stateToken,
      institutionName: institution.name,
      psuType: institution.psuType ?? undefined,
      countryCode: institution.countries[0],
      transactionTotalDays: institution.availableHistory ?? undefined,
    });

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
  const [connectionId = "", encodedOrigin = ""] = stateRaw.split(".");
  const decoded = encodedOrigin ? Buffer.from(encodedOrigin, "base64url").toString("utf8") : "/";
  const origin = decoded.startsWith("/") ? decoded : "/";
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
    await deleteBankConnection(db, connection.id, activeSpaceId).catch(() => undefined);
    return back({ bankError: message });
  }

  try {
    if (query.code && connection.provider === "enablebanking") {
      const provider = new Provider({ provider: "enablebanking" });
      const sessionId = await provider.exchangeCode!({ code: query.code });

      await updateBankConnectionLink(db, connection.id, {
        accessToken: sessionId,
        referenceId: sessionId,
        expiresAt: connection.expiresAt?.toISOString() ?? null,
      });
    }

    if (connection.provider === "gocardless") {
      const requisitionId = connection.accessToken ?? connection.referenceId;
      if (!requisitionId) {
        throw new Error("Missing GoCardless requisition id");
      }

      const provider = new Provider({ provider: "gocardless" });
      const { status } = await provider.getConnectionStatus({ id: requisitionId });

      if (status !== "connected") {
        throw new Error("Bank authorization was not completed");
      }
    }

    return back({ bankConnected: connection.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to complete bank connection";
    await deleteBankConnection(db, connection.id, activeSpaceId).catch(() => undefined);
    return back({ bankError: message });
  }
};
