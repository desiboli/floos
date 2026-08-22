import type { Account, AccountType, Institution } from "../../types";
import type { EBAccount, EBAspsp, EBBalance } from "./types";

/**
 * Stable catalog id. Enable Banking ASPSPs have no UUID.
 * POST /auth still uses aspsp: { name, country } and psu_type — not this string.
 */
const toInstitutionId = (name: string, country: string, psuType?: string) => {
  const base = `${name}_${country}`.toUpperCase().replace(/\s+/g, "_");
  if (!psuType) return base;
  return `${base}_${psuType.toUpperCase()}`;
};

export const transformInstitution = (aspsp: EBAspsp, psuType?: string): Institution => ({
  id: toInstitutionId(aspsp.name, aspsp.country, psuType),
  name: aspsp.name,
  logo: aspsp.logo ?? null,
  provider: "enablebanking",
  countries: [aspsp.country],
  availableHistory: null,
  psuType: psuType ?? null,
});

const getAccountType = (cashAccountType?: string): AccountType => {
  switch (cashAccountType) {
    case "CARD":
      return "credit";
    case "LOAN":
      return "loan";
    case "SVGS":
    case "CACC":
      return "depository";
    default:
      return "depository";
  }
};

const selectPrimaryBalance = (balances: EBBalance[]): EBBalance | undefined => {
  return (
    balances.find((b) => b.balance_type === "ITBD") ??
    balances.find((b) => b.balance_type === "CLBD") ??
    balances.find((b) => b.balance_type === "XPCD") ??
    balances[0]
  );
};

const toFiniteNumber = (value: string | undefined): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getAvailableBalance = (balances: EBBalance[]): number | null => {
  const available = balances.find((b) => b.balance_type === "ITAV");
  return available ? toFiniteNumber(available.balance_amount.amount) : null;
};

export const transformAccount = (params: {
  account: EBAccount;
  accountId: string;
  balances: EBBalance[];
  aspspName: string;
  aspspCountry: string;
  validUntil?: string;
}): Account => {
  const { account, accountId, balances, aspspName, aspspCountry, validUntil } = params;
  const type = getAccountType(account.cash_account_type);
  const primary = selectPrimaryBalance(balances);

  return {
    id: account.uid || accountId,
    name: account.name ?? account.product ?? aspspName,
    currency: account.currency || primary?.balance_amount.currency || "XXX",
    type,
    institution: {
      id: `${aspspName}_${aspspCountry}`.toUpperCase().replace(/\s+/g, "_"),
      name: aspspName,
      logo: null,
      provider: "enablebanking",
      countries: [aspspCountry],
      availableHistory: null,
      psuType: null,
    },
    balance: toFiniteNumber(primary?.balance_amount.amount) ?? 0,
    availableBalance: getAvailableBalance(balances),
    creditLimit: account.credit_limit ? toFiniteNumber(account.credit_limit.amount) : null,
    iban: account.account_id?.iban ?? null,
    bic: account.account_servicer?.bic_fi ?? null,
    expiresAt: validUntil ?? null,
  };
};
