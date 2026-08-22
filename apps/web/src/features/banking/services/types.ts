import type { InferRequestType, InferResponseType } from "hono/client";

import { api } from "@/lib/api-client";

export type CreateBankLinkInput = InferRequestType<typeof api.banking.link.$post>["json"];
export type CreateBankLinkResult = InferResponseType<typeof api.banking.link.$post, 200>;

export type ProviderAccountsResult = InferResponseType<
  (typeof api.banking.connections)[":id"]["provider-accounts"]["$get"],
  200
>;

export type ProviderAccount = ProviderAccountsResult["accounts"][number];

export type CommitAccountsInput = InferRequestType<
  (typeof api.banking.connections)[":id"]["accounts"]["$post"]
>["json"];

export type CommitAccountsResult = InferResponseType<
  (typeof api.banking.connections)[":id"]["accounts"]["$post"],
  200
>;

export type ToggleBankAccountResult = InferResponseType<
  (typeof api.banking.accounts)[":id"]["$patch"],
  200
>;

export type ConnectionTransactionsResult = InferResponseType<
  (typeof api.banking.connections)[":id"]["transactions"]["$get"],
  200
>;

export type SyncConnectionResult = InferResponseType<
  (typeof api.banking.connections)[":id"]["sync"]["$post"],
  202
>;
