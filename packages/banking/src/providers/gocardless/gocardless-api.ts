import { env } from "@floos/env/server";

import type {
  EndUserAgreement,
  GCInstitution,
  RefreshTokenResponse,
  Requisition,
  TokenResponse,
} from "./types";

const BASE_URL = "https://bankaccountdata.gocardless.com";

export class GoCardlessApi {
  #accessToken: string | null = null;
  #refreshToken: string | null = null;
  #accessExpiresAt = 0;

  getAccessToken = async (): Promise<string> => {
    if (this.#accessToken && Date.now() < this.#accessExpiresAt) {
      return this.#accessToken;
    }

    if (this.#refreshToken) {
      return this.#refreshAccessToken();
    }

    return this.#createNewToken();
  };

  /**
   * GET /api/v2/institutions/
   * Omit country for the full catalog (seed); pass ISO-2 to filter.
   */
  getInstitutions = async (countryCode?: string): Promise<GCInstitution[]> => {
    if (!countryCode) {
      return this.#request<GCInstitution[]>("/api/v2/institutions/");
    }

    const country = countryCode.toLowerCase();
    return this.#request<GCInstitution[]>(
      `/api/v2/institutions/?country=${encodeURIComponent(country)}`,
    );
  };

  /**
   * POST /api/v2/agreements/enduser/
   * Prefer 180/180; some banks reject that — retry 90/90.
   */
  createEndUserAgreement = async (
    institutionId: string,
    maxHistoricalDays?: number,
  ): Promise<EndUserAgreement> => {
    const createAgreement = (accessDays: number, historicalDays: number) =>
      this.#request<EndUserAgreement>("/api/v2/agreements/enduser/", {
        method: "POST",
        body: JSON.stringify({
          institution_id: institutionId,
          access_scope: ["balances", "details", "transactions"],
          access_valid_for_days: accessDays,
          max_historical_days: historicalDays,
        }),
      });

    const requested = maxHistoricalDays ?? 180;

    try {
      return await createAgreement(180, requested);
    } catch {
      return await createAgreement(90, 90);
    }
  };

  /** POST /api/v2/requisitions/ — returns hosted `link` + requisition `id`. */
  buildLink = async (params: {
    institutionId: string;
    redirect: string;
    agreement: string;
    reference?: string;
  }): Promise<Requisition> => {
    return this.#request<Requisition>("/api/v2/requisitions/", {
      method: "POST",
      body: JSON.stringify({
        institution_id: params.institutionId,
        redirect: params.redirect,
        agreement: params.agreement,
        reference: params.reference,
      }),
    });
  };

  /** GET /api/v2/requisitions/{id}/ — status `LN` means the user finished bank auth. */
  getRequisition = async (id: string): Promise<Requisition> => {
    return this.#request<Requisition>(`/api/v2/requisitions/${id}/`);
  };

  #request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const token = await this.getAccessToken();

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GoCardless API error (${res.status}): ${body}`);
    }

    return res.json() as Promise<T>;
  };

  #createNewToken = async (): Promise<string> => {
    const res = await fetch(`${BASE_URL}/api/v2/token/new/`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret_id: env.GOCARDLESS_SECRET_ID,
        secret_key: env.GOCARDLESS_SECRET_KEY,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GoCardless token/new failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as TokenResponse;

    this.#accessToken = data.access;
    this.#refreshToken = data.refresh;
    this.#accessExpiresAt = Date.now() + (data.access_expires - 60) * 1000;

    return data.access;
  };

  #refreshAccessToken = async (): Promise<string> => {
    const res = await fetch(`${BASE_URL}/api/v2/token/refresh/`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: this.#refreshToken }),
    });

    if (!res.ok) {
      this.#refreshToken = null;
      return this.#createNewToken();
    }

    const data = (await res.json()) as RefreshTokenResponse;

    this.#accessToken = data.access;
    this.#accessExpiresAt = Date.now() + (data.access_expires - 60) * 1000;

    return data.access;
  };
}
