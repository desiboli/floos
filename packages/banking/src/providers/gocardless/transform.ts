import type { Institution } from "../../types";
import type { GCInstitution } from "./types";

export const transformInstitution = (inst: GCInstitution): Institution => ({
  id: inst.id,
  name: inst.name,
  logo: inst.logo || null,
  provider: "gocardless",
  countries: inst.countries,
  availableHistory: Number(inst.transaction_total_days) || null,
  psuType: null,
});
