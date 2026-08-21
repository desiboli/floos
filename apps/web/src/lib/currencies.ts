import { countries, countriesByCode, type Country, type CurrencyCode } from "@/lib/countries";

const PINNED_CURRENCIES: CurrencyCode[] = ["EUR", "GBP", "SEK"];

export const uniqueCurrencies = [...new Set(countries.map((country) => country.currency))].sort(
  (a, b) => {
    const pinnedA = PINNED_CURRENCIES.indexOf(a);
    const pinnedB = PINNED_CURRENCIES.indexOf(b);
    if (pinnedA !== -1 || pinnedB !== -1) {
      return (pinnedA === -1 ? 99 : pinnedA) - (pinnedB === -1 ? 99 : pinnedB);
    }
    return a.localeCompare(b);
  },
) as [CurrencyCode, ...CurrencyCode[]];

export function getCurrencyForCountry(code: string): CurrencyCode | undefined {
  return countriesByCode.get(code)?.currency;
}

const currencyNames = new Intl.DisplayNames("en", { type: "currency" });

function getCurrencySymbol(code: string) {
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

export type CurrencyOption = {
  code: CurrencyCode;
  name: string;
  symbol: string;
  countries: Country[];
};

const countriesByCurrency = Map.groupBy(countries, (country) => country.currency);

export const currencyOptions: CurrencyOption[] = uniqueCurrencies.map((code) => ({
  code,
  name: currencyNames.of(code) ?? code,
  symbol: getCurrencySymbol(code),
  countries: countriesByCurrency.get(code) ?? [],
}));

export const currenciesByCode = new Map<string, CurrencyOption>(
  currencyOptions.map((currency) => [currency.code, currency]),
);
