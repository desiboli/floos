/**
 * GET /aspsps — Enable Banking "Get list of ASPSPs".
 * We only type fields the picker / createLink need.
 */
export type EBAspsp = {
  name: string;
  country: string;
  logo?: string;
  /** Hide these from the picker. */
  beta?: boolean;
  /** e.g. "personal" | "business" — POST /auth needs one of these. */
  psu_types?: string[];
  auth_methods?: Array<{
    name: string;
    psu_type?: string;
  }>;
};

export type EBAspspsResponse = {
  aspsps: EBAspsp[];
};

/** POST /auth */
export type EBAuthResponse = {
  url: string;
  authorization_id: string;
};

/** POST /sessions — callback `code` → session_id */
export type EBSessionResponse = {
  session_id: string;
};

export type EBAccount = {
  account_id: {
    iban?: string;
    other?: {
      identification: string;
      scheme_name: string;
    };
  };
  account_servicer?: {
    bic_fi?: string;
    name?: string;
  };
  name?: string;
  details?: string;
  usage?: string;
  cash_account_type?: string;
  product?: string;
  currency: string;
  credit_limit?: {
    currency: string;
    amount: string;
  };
  uid: string;
};

/** GET /sessions/{id} — account ids + ASPSP metadata for an active session */
export type EBSessionStatus = {
  status: string;
  access: {
    valid_until: string;
  };
  /** UUID strings on GET /sessions; POST /sessions may return full account objects. */
  accounts: Array<string | { uid: string }>;
  aspsp: {
    name: string;
    country: string;
  };
};

export type EBBalance = {
  name?: string;
  balance_amount: {
    currency: string;
    amount: string;
  };
  balance_type: string;
  reference_date?: string;
};

export type EBBalancesResponse = {
  balances: EBBalance[];
};
