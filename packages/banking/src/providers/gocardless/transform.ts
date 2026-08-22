import type { Account, AccountType, Institution, Transaction } from "../../types";
import type { GCAccountDetails, GCBalance, GCInstitution, GCTransaction } from "./types";

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

const remittanceText = (transaction: GCTransaction): string | null => {
  const unstructured = transaction.remittanceInformationUnstructured?.trim();
  if (unstructured) return unstructured;

  const fromArray = transaction.remittanceInformationUnstructuredArray
    ?.filter(Boolean)
    .join(" ")
    .trim();
  if (fromArray) return fromArray;

  const additional = transaction.additionalInformation?.trim();
  return additional || null;
};

const firstCurrencyExchange = (value: GCTransaction["currencyExchange"]) => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

export const transformTransaction = (transaction: GCTransaction): Transaction | null => {
  const id = transaction.internalTransactionId ?? transaction.transactionId;
  if (!id) return null;

  const date = transaction.bookingDate ?? transaction.valueDate;
  if (!date) return null;

  const amount = +transaction.transactionAmount.amount;
  if (!Number.isFinite(amount)) return null;

  const remittance = remittanceText(transaction);
  const preferred = amount >= 0 ? transaction.debtorName : transaction.creditorName;
  const other = amount >= 0 ? transaction.creditorName : transaction.debtorName;
  const counterpartyName = preferred?.trim() || other?.trim() || null;
  const fx = firstCurrencyExchange(transaction.currencyExchange);
  const currencyRate = fx?.exchangeRate != null ? Number(fx.exchangeRate) : null;
  const numericRate = currencyRate != null && Number.isFinite(currencyRate) ? currencyRate : null;
  const balanceRaw = transaction.balanceAfterTransaction?.balanceAmount?.amount;
  const balance = balanceRaw != null ? Number(balanceRaw) : null;

  return {
    id,
    date,
    amount,
    currency: transaction.transactionAmount.currency,
    name: counterpartyName || remittance || "No information",
    description: remittance,
    status: "posted",
    method:
      transaction.proprietaryBankTransactionCode?.trim() ||
      transaction.bankTransactionCode?.trim() ||
      null,
    counterpartyName,
    merchantName: null,
    balance: balance != null && Number.isFinite(balance) ? balance : null,
    currencyRate: numericRate,
    currencySource: numericRate != null ? (fx?.sourceCurrency?.toUpperCase() ?? null) : null,
  };
};
