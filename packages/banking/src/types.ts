export type BankProvider = "gocardless" | "enablebanking";

/**
 * Normalized bank for the connect UI.
 * Mapped from GoCardless institutions and Enable Banking ASPSPs.
 */
export type Institution = {
  /** Provider-native or synthesized id — pass this back when starting a connection. */
  id: string;
  name: string;
  logo: string | null;
  provider: BankProvider;
  /** ISO 3166-1 alpha-2, e.g. ["SE"] */
  countries: string[];
  /** Max transaction history in days, if the provider exposes it. */
  availableHistory: number | null;
  /**
   * Enable Banking only: "personal" | "business".
   * Null for GoCardless.
   */
  psuType: string | null;
};

export type GetInstitutionsRequest = {
  /** ISO 3166-1 alpha-2, e.g. "SE" */
  countryCode?: string;
};

export type CreateLinkRequest = {
  institutionId: string;
  /** Absolute URL the provider redirects to after bank auth (our /banking/callback). */
  redirect: string;
  /** Our token: connectionId.base64url(origin). Providers echo it as state/ref. */
  reference?: string;
  institutionName?: string;
  psuType?: string;
  /** GoCardless agreement history window. */
  transactionTotalDays?: number;
  /** ISO-2 — required for Enable Banking; do not parse from id. */
  countryCode?: string;
};

export type CreateLinkResponse = {
  /** Provider-hosted URL to send the user to. */
  url: string;
  /** GC requisition id, or EB authorization_id. Store on the connection. */
  ref: string;
  expiresAt: string | null;
};

export type GetConnectionStatusRequest = {
  /** GC requisition id, or EB session id. */
  id: string;
};

/**
 * Provider-facing link health.
 * GoCardless: `connected` means requisition status `LN` (user finished bank auth).
 */
export type ConnectionStatus = {
  status: "connected" | "disconnected" | "pending";
};
