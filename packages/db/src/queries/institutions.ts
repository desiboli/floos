import { arrayContains, asc, eq, sql } from "drizzle-orm";

import type { Database } from "..";

import { institutions, type InsertInstitution } from "../schema/institutions";

export type UpsertInstitutionInput = Pick<
  InsertInstitution,
  "id" | "name" | "logo" | "provider" | "countries" | "availableHistory" | "psuType"
>;

export async function upsertInstitutions(db: Database, rows: UpsertInstitutionInput[]) {
  if (rows.length === 0) {
    return { upserted: 0 };
  }

  const result = await db
    .insert(institutions)
    .values(rows)
    .onConflictDoUpdate({
      target: institutions.id,
      set: {
        name: sql`excluded.name`,
        logo: sql`excluded.logo`,
        provider: sql`excluded.provider`,
        countries: sql`excluded.countries`,
        availableHistory: sql`excluded.available_history`,
        psuType: sql`excluded.psu_type`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: institutions.id });

  return { upserted: result.length };
}

export async function getInstitutions(db: Database, countryCode: string) {
  const country = countryCode.toUpperCase();

  return db
    .select({
      id: institutions.id,
      name: institutions.name,
      logo: institutions.logo,
      provider: institutions.provider,
      countries: institutions.countries,
      availableHistory: institutions.availableHistory,
      psuType: institutions.psuType,
    })
    .from(institutions)
    .where(arrayContains(institutions.countries, [country]))
    .orderBy(asc(institutions.name));
}

export async function getInstitutionById(db: Database, id: string) {
  const [result] = await db
    .select({
      id: institutions.id,
      name: institutions.name,
      logo: institutions.logo,
      provider: institutions.provider,
      countries: institutions.countries,
      availableHistory: institutions.availableHistory,
      psuType: institutions.psuType,
    })
    .from(institutions)
    .where(eq(institutions.id, id))
    .limit(1);

  return result ?? null;
}
