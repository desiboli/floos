import type { InferRequestType, InferResponseType } from "hono/client";

import { api } from "@/lib/api-client";

export type CreateSpaceInput = InferRequestType<typeof api.spaces.$post>["json"];
export type CreateSpaceResult = InferResponseType<typeof api.spaces.$post, 201>;

export type SpacesResult = InferResponseType<typeof api.spaces.$get, 200>;
export type Space = SpacesResult["spaces"][number];

export type SetActiveInput = InferRequestType<typeof api.spaces.active.$post>["json"];
export type SetActiveResult = InferResponseType<typeof api.spaces.active.$post, 200>;

export type ActiveSpaceResult = InferResponseType<typeof api.spaces.active.$get, 200>;
