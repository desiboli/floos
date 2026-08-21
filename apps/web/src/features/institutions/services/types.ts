import type { InferResponseType } from "hono/client";

import { api } from "@/lib/api-client";

export type InstitutionsResult = InferResponseType<typeof api.institutions.$get, 200>;

export type Institution = InstitutionsResult["institutions"][number];
