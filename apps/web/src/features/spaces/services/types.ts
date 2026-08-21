import type { InferRequestType, InferResponseType } from "hono/client";

import { api } from "@/lib/api-client";

export type CreateSpaceInput = InferRequestType<typeof api.spaces.$post>["json"];
export type CreateSpaceResult = InferResponseType<typeof api.spaces.$post, 201>;
