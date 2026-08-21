import { env } from "@floos/env/server";
import { createSign } from "node:crypto";

import type { EBAspspsResponse, EBAuthResponse, EBSessionResponse } from "./types";

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

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Enable Banking API error (${res.status}): ${body}`);
    }

    return res.json() as Promise<T>;
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
}
