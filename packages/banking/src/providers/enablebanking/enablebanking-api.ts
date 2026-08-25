import { env } from "@floos/env/server";
import { createSign } from "node:crypto";

import type {
  EBAccount,
  EBAspspsResponse,
  EBAuthResponse,
  EBBalancesResponse,
  EBSessionResponse,
  EBSessionStatus,
  EBTransactionsResponse,
} from "./types";

const BASE_URL = "https://api.enablebanking.com";

export class EnableBankingApi {
  #getJwt = (): string => {
    const header = {
      typ: "JWT",
      alg: "RS256",
      kid: env.ENABLEBANKING_APP_ID,
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: "enablebanking.com",
      aud: "api.enablebanking.com",
      iat: now,
      exp: now + 3600,
    };

    const encode = (value: Record<string, unknown>) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");

    const headerB64 = encode(header);
    const payloadB64 = encode(payload);
    const signingInput = `${headerB64}.${payloadB64}`;

    const signer = createSign("RSA-SHA256");
    signer.update(signingInput);
    signer.end();

    const signature = signer.sign(env.ENABLEBANKING_PRIVATE_KEY, "base64url");

    return `${signingInput}.${signature}`;
  };

  #request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.#getJwt()}`,
        ...options.headers,
      },
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`Enable Banking API error (${res.status}): ${text}`);
    }

    if (!text.trim()) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  };

  /** GET /aspsps — omit country for the full catalog (seed). */
  getAspsps = async (countryCode?: string): Promise<EBAspspsResponse> => {
    if (!countryCode) {
      return this.#request<EBAspspsResponse>("/aspsps");
    }

    const country = countryCode.toUpperCase();
    return this.#request<EBAspspsResponse>(`/aspsps?country=${encodeURIComponent(country)}`);
  };

  /** POST /auth — returns the URL to send the user to. */
  startAuth = async (params: {
    aspspName: string;
    aspspCountry: string;
    redirectUrl: string;
    validUntil: string;
    state?: string;
    psuType?: string;
  }): Promise<EBAuthResponse> => {
    return this.#request<EBAuthResponse>("/auth", {
      method: "POST",
      body: JSON.stringify({
        access: {
          valid_until: params.validUntil,
        },
        aspsp: {
          name: params.aspspName,
          country: params.aspspCountry,
        },
        state: params.state ?? crypto.randomUUID(),
        redirect_url: params.redirectUrl,
        psu_type: params.psuType ?? "personal",
      }),
    });
  };

  /** POST /sessions — callback `code` → `session_id`. */
  createSession = async (code: string): Promise<EBSessionResponse> => {
    return this.#request<EBSessionResponse>("/sessions", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  };

  /** GET /sessions/{id} */
  getSession = async (sessionId: string): Promise<EBSessionStatus> => {
    return this.#request<EBSessionStatus>(`/sessions/${sessionId}`);
  };

  /** DELETE /sessions/{id} — revoke the AIS session. */
  deleteSession = async (sessionId: string): Promise<void> => {
    await this.#request<void>(`/sessions/${sessionId}`, { method: "DELETE" });
  };

  /** GET /accounts/{id}/details */
  getAccountDetails = async (accountId: string): Promise<EBAccount> => {
    return this.#request<EBAccount>(`/accounts/${accountId}/details`);
  };

  /** GET /accounts/{id}/balances */
  getAccountBalances = async (accountId: string): Promise<EBBalancesResponse> => {
    return this.#request<EBBalancesResponse>(`/accounts/${accountId}/balances`);
  };

  /**
   * GET /accounts/{id}/transactions
   * Keep strategy, status, and dates identical on every page; only continuation_key changes.
   * Empty `transactions` with a continuation_key still means more pages.
   */
  getAccountTransactions = async (params: {
    accountId: string;
    dateFrom: string;
    dateTo?: string;
    strategy: "default" | "longest";
    continuationKey?: string;
  }): Promise<EBTransactionsResponse> => {
    const search = new URLSearchParams({
      strategy: params.strategy,
      transaction_status: "BOOK",
      date_from: params.dateFrom,
    });

    if (params.dateTo) {
      search.set("date_to", params.dateTo);
    }
    if (params.continuationKey) {
      search.set("continuation_key", params.continuationKey);
    }

    return this.#request<EBTransactionsResponse>(
      `/accounts/${params.accountId}/transactions?${search.toString()}`,
    );
  };
}
