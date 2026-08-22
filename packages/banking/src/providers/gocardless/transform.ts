import type { Account, AccountType, Institution } from "../../types";
import type { GCAccountDetails, GCBalance, GCInstitution } from "./types";

export const transformInstitution = (inst: GCInstitution): Institution => ({
  id: inst.id,
  name: inst.name,
  logo: inst.logo || null,
  provider: "gocardless",
  countries: inst.countries,
  availableHistory: Number(inst.transaction_total_days) || null,
  psuType: null,
});

const getAccountType = (cashAccountType?: string): AccountType => {
  switch (cashAccountType) {
    case "CARD":
      return "credit";
    case "LOAN":
      return "loan";
    default:
      return "depository";
  }
};

const selectPrimaryBalance = (balances: GCBalance[], currency: string): GCBalance | undefined => {
  const matching = balances.filter((b) => b.balanceAmount.currency === currency);

  return (
    matching.find((b) => b.balanceType === "interimBooked") ??
    matching.find((b) => b.balanceType === "closingBooked") ??
    matching.find((b) => b.balanceType === "expected") ??
    matching[0]
  );
};

const getAvailableBalance = (balances: GCBalance[], currency: string): number | null => {
  const available = balances.find(
    (b) => b.balanceType === "interimAvailable" && b.balanceAmount.currency === currency,
  );

  return available ? Number(available.balanceAmount.amount) : null;
};

export const transformAccount = (params: {
  id: string;
  details: GCAccountDetails;
  balances: GCBalance[];
  institution: GCInstitution;
  accessValidForDays?: number;
}): Account => {
  const { id, details, balances, institution, accessValidForDays } = params;
  const acct = details.account;
  const type = getAccountType(acct.cashAccountType);
  const currency = acct.currency;
  const primary = selectPrimaryBalance(balances, currency);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (accessValidForDays ?? 180));

  return {
    id,
    name: acct.name ?? acct.product ?? institution.name,
    currency,
    type,
    institution: transformInstitution(institution),
    balance: primary ? Number(primary.balanceAmount.amount) : 0,
    availableBalance: getAvailableBalance(balances, currency),
    creditLimit: null,
    iban: acct.iban ?? null,
    bic: acct.bic ?? institution.bic ?? null,
    expiresAt: expiresAt.toISOString(),
  };
};
