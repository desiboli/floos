import type { InferRequestType, InferResponseType } from "hono/client";

import { api } from "@/lib/api-client";

export type ExampleResult = InferResponseType<typeof api.example.$get, 200>;
export type PutExampleInput = InferRequestType<(typeof api.example)[":id"]["$put"]>["json"];
export type PutExampleResult = InferResponseType<(typeof api.example)[":id"]["$put"], 200>;
export type PatchExampleInput = InferRequestType<(typeof api.example)[":id"]["$patch"]>["json"];
export type PatchExampleResult = InferResponseType<(typeof api.example)[":id"]["$patch"], 200>;
export type DeleteExampleResult = InferResponseType<(typeof api.example)[":id"]["$delete"], 200>;
