import type { BankingProvider } from "./interface";
import type { BankProvider } from "./types";

import { EnableBankingProvider } from "./providers/enablebanking/enablebanking-provider";
import { GoCardlessProvider } from "./providers/gocardless/gocardless-provider";

/**
 * App-facing entry point for banking providers.
 *
 *   const banking = new Provider({ provider: "gocardless" });
 *   await banking.getInstitutions({ countryCode: "SE" });
 */
export class Provider implements BankingProvider {
  #provider: BankingProvider;

  constructor({ provider }: { provider: BankProvider }) {
    switch (provider) {
      case "gocardless":
        this.#provider = new GoCardlessProvider();
        break;
      case "enablebanking":
        this.#provider = new EnableBankingProvider();
        break;
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Unknown provider: ${_exhaustive}`);
      }
    }
  }

  getInstitutions: BankingProvider["getInstitutions"] = (params) =>
    this.#provider.getInstitutions(params);

  createLink: BankingProvider["createLink"] = (params) => this.#provider.createLink(params);

  getConnectionStatus: BankingProvider["getConnectionStatus"] = (params) =>
    this.#provider.getConnectionStatus(params);

  getAccounts: BankingProvider["getAccounts"] = (params) => this.#provider.getAccounts(params);

  getTransactions: BankingProvider["getTransactions"] = (params) =>
    this.#provider.getTransactions(params);

  exchangeCode: BankingProvider["exchangeCode"] = (params) => {
    if (!this.#provider.exchangeCode) {
      throw new Error("exchangeCode is not supported for this provider");
    }
    return this.#provider.exchangeCode(params);
  };
}
