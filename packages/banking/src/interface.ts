import type {
  Account,
  ConnectionStatus,
  CreateLinkRequest,
  CreateLinkResponse,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsRequest,
  GetConnectionStatusRequest,
  GetInstitutionsRequest,
  GetTransactionsRequest,
  Institution,
  Transaction,
} from "./types";

export interface BankingProvider {
  getInstitutions(params: GetInstitutionsRequest): Promise<Institution[]>;
  createLink(params: CreateLinkRequest): Promise<CreateLinkResponse>;
  getConnectionStatus(params: GetConnectionStatusRequest): Promise<ConnectionStatus>;
  getAccounts(params: GetAccountsRequest): Promise<Account[]>;
  getAccountBalance(params: GetAccountBalanceRequest): Promise<GetAccountBalanceResponse>;
  getTransactions(params: GetTransactionsRequest): Promise<Transaction[]>;
  /**
   * Enable Banking: exchange callback `code` → session id + consent expiry.
   * GoCardless does not use this (omit it on that class).
   */
  exchangeCode?(params: { code: string }): Promise<{ sessionId: string; expiresAt: string | null }>;
  /** GoCardless: consent expiry from the requisition's agreement. Enable Banking omits this. */
  getExpiresAt?(params: { id: string }): Promise<string | null>;
}
