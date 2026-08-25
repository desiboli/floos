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

export type AccountType = "depository" | "credit" | "loan" | "investment" | "other";

/**
 * Normalized account from a provider session/requisition.
 * `id` is the provider-native account id (stored later as bank_accounts.account_id).
 */
export type Account = {
  id: string;
  name: string;
  currency: string;
  type: AccountType;
  institution: Institution;
  balance: number;
  availableBalance: number | null;
  creditLimit: number | null;
  iban: string | null;
  bic: string | null;
  expiresAt: string | null;
};

export type GetAccountsRequest = {
  /** GC requisition id or EB session id (stored on bank_connections.accessToken). */
  id: string;
};

export type DeleteConnectionRequest = {
  /** GC requisition id or EB session id. */
  id: string;
};

export type GetAccountBalanceRequest = {
  /** Provider-native account id (bank_accounts.account_id). */
  accountId: string;
  /** GC: pick the stored-currency balance when the AIS payload is multi-currency. */
  currency?: string;
  accountType?: AccountType;
};

/** `amount` is null when the provider returned nothing parseable — do not persist 0. */
export type GetAccountBalanceResponse = {
  currency: string | null;
  amount: number | null;
  availableBalance: number | null;
};

/**
 * Normalized booked transaction. `id` is persisted as bank_transactions.providerTransactionId.
 * merchantName is always null from AIS (MCC only). The enrich-transactions job fills it.
 */
export type Transaction = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** Already signed (credits positive, debits negative). */
  amount: number;
  currency: string;
  name: string;
  description: string | null;
  status: "posted" | "pending";
  method: string | null;
  /** Other party: debtor on credit, creditor on debit. */
  counterpartyName: string | null;
  merchantName: string | null;
  /** Balance after this transaction, already signed as stored. */
  balance: number | null;
  currencyRate: number | null;
  currencySource: string | null;
};

export type GetTransactionsRequest = {
  /** Provider-native account id (bank_accounts.account_id). */
  accountId: string;
  /** true = ~5 days; false/omit = full history. Providers compute the window. */
  latest?: boolean;
  /** Pass through; unused for category (no categorySlug here). */
  accountType?: AccountType;
};
