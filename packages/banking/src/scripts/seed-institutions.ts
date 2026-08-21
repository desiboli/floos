import { db } from "@floos/db";
import { getInstitutions, upsertInstitutions } from "@floos/db/queries";

import type { BankProvider } from "../types";

import { fetchAllInstitutions } from "../fetch-institutions";

const CHUNK_SIZE = 500;

/**
 *   pnpm --filter @floos/banking seed:institutions
 *     → all providers, full catalogs
 *
 *   pnpm --filter @floos/banking seed:institutions SE
 *     → keep only banks that serve SE
 *
 *   pnpm --filter @floos/banking seed:institutions SE gocardless
 *     → one provider, optionally filter to SE
 */
const countryFilter = process.argv[2]?.toUpperCase();
const providerArg = process.argv[3] as BankProvider | undefined;

const main = async () => {
  const providers = providerArg
    ? [providerArg]
    : (["gocardless", "enablebanking"] as BankProvider[]);

  console.log(
    `Seeding providers=[${providers.join(", ")}]${
      countryFilter ? ` filterCountry=${countryFilter}` : " (full catalog)"
    }`,
  );

  const { institutions, errors, succeededProviders } = await fetchAllInstitutions({ providers });

  if (errors.length > 0) {
    console.warn("Provider errors:", errors);
  }
  console.log(`Succeeded: ${succeededProviders.join(", ") || "(none)"}`);

  const toUpsert = countryFilter
    ? institutions.filter((inst) =>
        inst.countries.map((c) => c.toUpperCase()).includes(countryFilter),
      )
    : institutions;

  console.log(`Upserting ${toUpsert.length} institutions (of ${institutions.length} fetched)`);

  let upserted = 0;
  for (let i = 0; i < toUpsert.length; i += CHUNK_SIZE) {
    const chunk = toUpsert.slice(i, i + CHUNK_SIZE);
    const result = await upsertInstitutions(
      db,
      chunk.map((inst) => ({
        id: inst.id,
        name: inst.name,
        logo: inst.logo,
        provider: inst.provider,
        countries: inst.countries,
        availableHistory: inst.availableHistory,
        psuType: inst.psuType,
      })),
    );
    upserted += result.upserted;
    console.log(`  chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${result.upserted} rows`);
  }

  console.log(`Done. Upserted ${upserted} rows total.`);

  if (countryFilter) {
    const fromDb = await getInstitutions(db, countryFilter);
    console.log(`DB has ${fromDb.length} institutions for ${countryFilter}`);
    console.table(
      fromDb.slice(0, 5).map((inst) => ({
        id: inst.id,
        name: inst.name,
        provider: inst.provider,
      })),
    );
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
