import type { BankProvider, Institution } from "./types";

import { Provider } from "./provider";

export type FetchInstitutionsResult = {
  institutions: Institution[];
  errors: { provider: BankProvider; error: string }[];
  succeededProviders: BankProvider[];
};

const ALL_PROVIDERS: BankProvider[] = ["gocardless", "enablebanking"];

/**
 * Full catalogs from all (or selected) providers.
 * Promise.allSettled so one failure does not abort the other.
 */
export async function fetchAllInstitutions(options?: {
  providers?: BankProvider[];
}): Promise<FetchInstitutionsResult> {
  const providers = options?.providers ?? ALL_PROVIDERS;

  const results = await Promise.allSettled(
    providers.map(async (providerName) => {
      const banking = new Provider({ provider: providerName });
      const institutions = await banking.getInstitutions({});
      return { providerName, institutions };
    }),
  );

  const institutions: Institution[] = [];
  const errors: FetchInstitutionsResult["errors"] = [];
  const succeededProviders: BankProvider[] = [];

  for (let i = 0; i < results.length; i++) {
    const providerName = providers[i]!;
    const result = results[i]!;

    if (result.status === "fulfilled") {
      institutions.push(...result.value.institutions);
      succeededProviders.push(providerName);
      console.log(`[${providerName}] ${result.value.institutions.length} institutions`);
    } else {
      const message =
        result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push({ provider: providerName, error: message });
      console.warn(`[${providerName}] failed —`, message);
    }
  }

  return { institutions, errors, succeededProviders };
}
