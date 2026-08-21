export type TokenResponse = {
  access: string;
  access_expires: number;
  refresh: string;
  refresh_expires: number;
};

export type RefreshTokenResponse = {
  access: string;
  access_expires: number;
};

/** Raw shape from GET /api/v2/institutions/ */
export type GCInstitution = {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
  logo: string;
  max_access_valid_for_days: string;
};

/** Raw shape from POST /api/v2/agreements/enduser/ */
export type EndUserAgreement = {
  id: string;
  created: string;
  max_historical_days: number;
  access_valid_for_days: number;
  access_scope: string[];
  institution_id: string;
};

/** Raw shape from POST /api/v2/requisitions/ and GET /api/v2/requisitions/{id}/ */
export type Requisition = {
  id: string;
  created: string;
  redirect: string;
  status: string;
  institution_id: string;
  agreement: string;
  reference: string;
  accounts: string[];
  link: string;
};
