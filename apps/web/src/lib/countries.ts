/**
 * Countries where at least one open-banking AIS provider we use has coverage:
 * - GoCardless Bank Account Data: EEA PSD2 markets + UK
 *   (https://docs.gocardless.com/docs/bank-account-data)
 * - Enable Banking: 30 EEA markets (docs/markets; no UK)
 *
 * Union of both. Exclude sandbox-only codes (e.g. XX).
 * BG → EUR (Bulgaria joined the euro area on 2026-01-01).
 */
const COUNTRIES = [
  { code: "AT", name: "Austria", currency: "EUR" },
  { code: "BE", name: "Belgium", currency: "EUR" },
  { code: "BG", name: "Bulgaria", currency: "EUR" },
  { code: "HR", name: "Croatia", currency: "EUR" },
  { code: "CY", name: "Cyprus", currency: "EUR" },
  { code: "CZ", name: "Czech Republic", currency: "CZK" },
  { code: "DK", name: "Denmark", currency: "DKK" },
  { code: "EE", name: "Estonia", currency: "EUR" },
  { code: "FI", name: "Finland", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "GR", name: "Greece", currency: "EUR" },
  { code: "HU", name: "Hungary", currency: "HUF" },
  { code: "IS", name: "Iceland", currency: "ISK" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "LV", name: "Latvia", currency: "EUR" },
  { code: "LI", name: "Liechtenstein", currency: "CHF" },
  { code: "LT", name: "Lithuania", currency: "EUR" },
  { code: "LU", name: "Luxembourg", currency: "EUR" },
  { code: "MT", name: "Malta", currency: "EUR" },
  { code: "NL", name: "Netherlands", currency: "EUR" },
  { code: "NO", name: "Norway", currency: "NOK" },
  { code: "PL", name: "Poland", currency: "PLN" },
  { code: "PT", name: "Portugal", currency: "EUR" },
  { code: "RO", name: "Romania", currency: "RON" },
  { code: "SK", name: "Slovakia", currency: "EUR" },
  { code: "SI", name: "Slovenia", currency: "EUR" },
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "SE", name: "Sweden", currency: "SEK" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];
export type CurrencyCode = (typeof COUNTRIES)[number]["currency"];

export type Country = {
  code: CountryCode;
  name: string;
  currency: CurrencyCode;
  flag: string;
};

/** Regional-indicator flag from an ISO 3166-1 alpha-2 code. */
export function flagEmoji(countryCode: string) {
  if (countryCode.length !== 2) return "";
  const OFFSET = 0x1f1e6 - 65;
  return String.fromCodePoint(
    ...[...countryCode.toUpperCase()].map((c) => OFFSET + c.charCodeAt(0)),
  );
}

export const countries: Country[] = COUNTRIES.map((country) => ({
  ...country,
  flag: flagEmoji(country.code),
}));

export const countriesByCode = new Map<string, Country>(
  countries.map((country) => [country.code, country]),
);
export const countryCodes = countries.map((country) => country.code) as [
  CountryCode,
  ...CountryCode[],
];
