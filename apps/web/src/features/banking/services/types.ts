import type { InferRequestType, InferResponseType } from "hono/client";

import { api } from "@/lib/api-client";

export type CreateBankLinkInput = InferRequestType<typeof api.banking.link.$post>["json"];
export type CreateBankLinkResult = InferResponseType<typeof api.banking.link.$post, 200>;
