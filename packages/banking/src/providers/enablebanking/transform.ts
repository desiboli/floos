import type { Institution } from "../../types";
import type { EBAspsp } from "./types";

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
