import type { BankingProvider } from "../../interface";
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
} from "../../types";

import { GoCardlessApi } from "./gocardless-api";
import {
  transformAccount,
  transformAccountBalance,
  transformInstitution,
  transformTransaction,
} from "./transform";

export class GoCardlessProvider implements BankingProvider {
  #api = new GoCardlessApi();

  getInstitutions = async ({ countryCode }: GetInstitutionsRequest): Promise<Institution[]> => {
    const institutions = await this.#api.getInstitutions(countryCode);

    // Some banks have *_DECOUPLED_* siblings (same bank, alternate auth).
    // Keep the canonical id for the picker.
    return institutions
      .filter((inst) => !inst.id.includes("_DECOUPLED_"))
      .map(transformInstitution);
  };

  createLink = async ({
    institutionId,
    redirect,
    reference,
    transactionTotalDays,
  }: CreateLinkRequest): Promise<CreateLinkResponse> => {
    const agreement = await this.#api.createEndUserAgreement(institutionId, transactionTotalDays);

    const requisition = await this.#api.buildLink({
      institutionId,
      redirect,
      agreement: agreement.id,
      reference,
    });

    const expiresAt = new Date(
      Date.now() + agreement.access_valid_for_days * 24 * 60 * 60 * 1000,
    ).toISOString();

    return {
      url: requisition.link,
      ref: requisition.id,
      expiresAt,
    };
  };

  getConnectionStatus = async ({ id }: GetConnectionStatusRequest): Promise<ConnectionStatus> => {
    try {
      const requisition = await this.#api.getRequisition(id);

      if (requisition.status === "LN") {
        return { status: "connected" };
      }
      if (requisition.status === "EX" || requisition.status === "RJ") {
        return { status: "disconnected" };
      }
      return { status: "pending" };
    } catch {
      return { status: "disconnected" };
    }
  };

  getAccounts = async ({ id }: GetAccountsRequest): Promise<Account[]> => {
    const requisition = await this.#api.getRequisition(id);

    if (!requisition.accounts?.length) {
      return [];
    }

    let institution = await this.#api.getInstitution(requisition.institution_id).catch(() => null);

    if (!institution) {
      const institutions = await this.#api.getInstitutions();
      institution = institutions.find((i) => i.id === requisition.institution_id) ?? null;
    }

    if (!institution) {
      return [];
    }

    return Promise.all(
      requisition.accounts.map(async (accountId) => {
        const [details, balancesRes] = await Promise.all([
          this.#api.getAccountDetails(accountId),
          this.#api.getAccountBalances(accountId),
        ]);

        return transformAccount({
          id: accountId,
          details,
          balances: balancesRes.balances,
          institution,
        });
      }),
    );
  };

  getAccountBalance = async ({
    accountId,
    currency,
  }: GetAccountBalanceRequest): Promise<GetAccountBalanceResponse> => {
    const balancesRes = await this.#api.getAccountBalances(accountId);
    return transformAccountBalance(balancesRes.balances ?? [], currency);
  };

  getTransactions = async ({
    accountId,
    latest,
  }: GetTransactionsRequest): Promise<Transaction[]> => {
    const dateFrom = latest === true ? utcDaysAgo(5) : undefined;
    const response = await this.#api.getAccountTransactions({ accountId, dateFrom });

    return (response.transactions.booked ?? []).flatMap((raw) => {
      const tx = transformTransaction(raw);
      return tx ? [tx] : [];
    });
  };
}

function utcDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
