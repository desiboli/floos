const amountFormatters = new Map<string, Intl.NumberFormat>();

function getAmountFormatter(currency: string) {
  const cached = amountFormatters.get(currency);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  });
  amountFormatters.set(currency, formatter);
  return formatter;
}

export function formatAmount(amount: number, currency: string) {
  const value = Number.isFinite(amount) ? amount : 0;

  try {
    return getAmountFormatter(currency).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

export function maskIban(iban: string | null): string | null {
  if (!iban) return null;
  const compact = iban.replace(/\s+/g, "");
  if (compact.length < 4) return null;
  return `····${compact.slice(-4)}`;
}
