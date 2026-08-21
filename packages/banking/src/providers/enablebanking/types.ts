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
