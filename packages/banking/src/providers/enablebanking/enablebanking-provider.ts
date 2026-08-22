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

import { EnableBankingApi } from "./enablebanking-api";
import {
  transformAccount,
  transformAccountBalance,
  transformInstitution,
  transformTransaction,
} from "./transform";
import type { EBTransaction } from "./types";

export class EnableBankingProvider implements BankingProvider {
  #api = new EnableBankingApi();

  getInstitutions = async ({ countryCode }: GetInstitutionsRequest): Promise<Institution[]> => {
    const { aspsps } = await this.#api.getAspsps(countryCode);
    const results: Institution[] = [];

    for (const aspsp of aspsps) {
      if (aspsp.beta) continue;

      const fromField = aspsp.psu_types ?? [];
      const fromAuth =
        aspsp.auth_methods
          ?.map((method) => method.psu_type)
          .filter((value): value is string => Boolean(value)) ?? [];

      const psuTypes = [...new Set(fromField.length > 0 ? fromField : fromAuth)];

      if (psuTypes.length === 0) {
        results.push(transformInstitution(aspsp));
        continue;
      }

      for (const psuType of psuTypes) {
        results.push(transformInstitution(aspsp, psuType));
      }
    }

    return results;
  };

  createLink = async ({
    redirect,
    reference,
    institutionName,
    psuType,
    countryCode,
  }: CreateLinkRequest): Promise<CreateLinkResponse> => {
    if (!institutionName) {
      throw new Error("Enable Banking createLink requires institutionName");
    }
    if (!countryCode) {
      throw new Error("Enable Banking createLink requires countryCode");
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 90);
    const expiresAt = validUntil.toISOString();

    const authResponse = await this.#api.startAuth({
      aspspName: institutionName,
      aspspCountry: countryCode.toUpperCase(),
      redirectUrl: redirect,
      validUntil: expiresAt,
      state: reference,
      psuType: psuType ?? undefined,
    });

    return {
      url: authResponse.url,
      ref: authResponse.authorization_id,
      expiresAt,
    };
  };

  exchangeCode = async ({ code }: { code: string }): Promise<string> => {
    const session = await this.#api.createSession(code);
    return session.session_id;
  };

  getConnectionStatus = async ({ id }: GetConnectionStatusRequest): Promise<ConnectionStatus> => {
    if (!id) return { status: "disconnected" };
    return { status: "connected" };
  };

  getAccounts = async ({ id }: GetAccountsRequest): Promise<Account[]> => {
    const session = await this.#api.getSession(id);
    const accountIds = sessionAccountIds(session.accounts);

    if (accountIds.length === 0) {
      return [];
    }

    return Promise.all(
      accountIds.map(async (accountId) => {
        const [account, balancesRes] = await Promise.all([
          this.#api.getAccountDetails(accountId),
          this.#api.getAccountBalances(accountId),
        ]);

        return transformAccount({
          account,
          accountId,
          balances: balancesRes.balances,
          aspspName: session.aspsp.name,
          aspspCountry: session.aspsp.country,
          validUntil: session.access.valid_until,
        });
      }),
    );
  };

  getAccountBalance = async ({
    accountId,
  }: GetAccountBalanceRequest): Promise<GetAccountBalanceResponse> => {
    const balancesRes = await this.#api.getAccountBalances(accountId);
    return transformAccountBalance(balancesRes.balances ?? []);
  };

  getTransactions = async ({
    accountId,
    latest,
  }: GetTransactionsRequest): Promise<Transaction[]> => {
    if (latest === true) {
      return mapTransactions(
        await this.#fetchAll({
          accountId,
          dateFrom: utcDaysAgo(5),
          dateTo: utcToday(),
          strategy: "default",
        }),
      );
    }

    const longest = await this.#fetchAll({
      accountId,
      dateFrom: utcDaysAgo(730),
      strategy: "longest",
    }).catch(() => null);

    if (!longest) {
      return mapTransactions(await this.#fetchLatestYear(accountId));
    }

    const mostRecent = longest.reduce<string | undefined>((acc, tx) => {
      const date = tx.booking_date ?? tx.value_date;
      if (!date) return acc;
      return !acc || date > acc ? date : acc;
    }, undefined);

    if (!mostRecent || mostRecent < utcDaysAgo(7)) {
      const topUp = await this.#fetchLatestYear(accountId);
      return mapTransactions([...longest, ...topUp]);
    }

    return mapTransactions(longest);
  };

  #fetchLatestYear = (accountId: string) =>
    this.#fetchAll({
      accountId,
      dateFrom: utcDaysAgo(365),
      dateTo: utcToday(),
      strategy: "default",
    });

  /** Paginate until continuation_key is gone. Empty pages with a key still continue. */
  #fetchAll = async (params: {
    accountId: string;
    dateFrom: string;
    dateTo?: string;
    strategy: "default" | "longest";
  }): Promise<EBTransaction[]> => {
    const all: EBTransaction[] = [];
    let continuationKey: string | undefined;

    do {
      const page = await this.#api.getAccountTransactions({
        ...params,
        continuationKey,
      });
      all.push(...(page.transactions ?? []));
      continuationKey = page.continuation_key || undefined;
    } while (continuationKey);

    return all;
  };
}

function mapTransactions(raw: EBTransaction[]): Transaction[] {
  return raw.flatMap((tx) => {
    const mapped = transformTransaction(tx);
    return mapped ? [mapped] : [];
  });
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function utcDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function sessionAccountIds(accounts: Array<string | { uid: string }> | undefined): string[] {
  if (!accounts?.length) return [];

  return accounts.flatMap((item) => {
    if (typeof item === "string" && item.length > 0) return [item];
    if (typeof item === "object" && item && typeof item.uid === "string" && item.uid.length > 0) {
      return [item.uid];
    }
    return [];
  });
}
