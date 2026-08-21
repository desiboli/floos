import { api } from "@/lib/api-client";

import type { InstitutionsResult } from "./types";

export async function getInstitutions(country: string): Promise<InstitutionsResult> {
  const res = await api.institutions.$get({
    query: { country },
  });

  if (!res.ok) throw new Error("Failed to fetch institutions");
  return res.json();
}
