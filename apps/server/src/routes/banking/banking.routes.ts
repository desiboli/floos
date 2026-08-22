import { createRoute, z } from "@hono/zod-openapi";

import * as HTTPStatusCodes from "../../http-status-codes";
import jsonContent from "../../openapi/helpers/json-content";

const tags = ["Banking"];

export const createLinkSchema = z.object({
  institutionId: z.string().min(1).openapi({
    example: "SANDBOXFINANCE_SFIN0000",
  }),
  /** App path to return to after bank auth (must start with "/"). */
  origin: z.string().startsWith("/").openapi({
    example: "/onboarding?s=connect-bank",
  }),
});

export const createLinkResponseSchema = z.object({
  redirectUrl: z.url(),
  connectionId: z.uuid(),
});

export const createLink = createRoute({
  tags,
  path: "/banking/link",
  method: "post",
  summary: "Start a bank connection flow",
  request: {
    body: {
      ...jsonContent(createLinkSchema, "Institution and return path"),
      required: true,
    },
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(
      createLinkResponseSchema,
      "Provider auth URL and pending connection id",
    ),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ error: z.string() }),
      "Invalid request or institution",
    ),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
  },
});

export type CreateLinkRoute = typeof createLink;

export const callback = createRoute({
  tags,
  path: "/banking/callback",
  method: "get",
  summary: "Banking provider AIS callback",
  request: {
    query: z.object({
      /** GoCardless often returns our reference as `ref`. */
      ref: z.string().optional(),
      /** Enable Banking uses `state`. */
      state: z.string().optional(),
      code: z.string().optional(),
      error: z.string().optional(),
      error_description: z.string().optional(),
    }),
  },
  responses: {
    [HTTPStatusCodes.MOVED_TEMPORARILY]: {
      description: "Redirect back to the web app",
    },
  },
});

export type CallbackRoute = typeof callback;

export const accountTypeSchema = z.enum(["depository", "credit", "loan", "investment", "other"]);

export const providerAccountSchema = z.object({
  providerAccountId: z.string(),
  name: z.string(),
  type: accountTypeSchema,
  currency: z.string(),
  balance: z.number(),
  availableBalance: z.number().nullable(),
  creditLimit: z.number().nullable(),
  iban: z.string().nullable(),
  bic: z.string().nullable(),
});

export const listProviderAccountsResponseSchema = z.object({
  accounts: z.array(providerAccountSchema),
});

export const listProviderAccounts = createRoute({
  tags,
  path: "/banking/connections/{id}/provider-accounts",
  method: "get",
  summary: "List accounts available for a connection (live from provider, no DB writes)",
  request: {
    params: z.object({
      id: z.uuid(),
    }),
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(
      listProviderAccountsResponseSchema,
      "Accounts the bank reports for this connection",
    ),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ error: z.string() }),
      "Invalid request or provider error",
    ),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
    [HTTPStatusCodes.NOT_FOUND]: jsonContent(z.object({ error: z.string() }), "Connection not found"),
  },
});

export type ListProviderAccountsRoute = typeof listProviderAccounts;

export const commitAccountsSchema = z.object({
  accounts: z
    .array(
      providerAccountSchema.extend({
        enabled: z.boolean(),
      }),
    )
    .min(1),
});

export const commitAccountsResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  enabledCount: z.number().int().nonnegative(),
});

export const commitAccounts = createRoute({
  tags,
  path: "/banking/connections/{id}/accounts",
  method: "post",
  summary: "Persist the user's account selection for a connection",
  request: {
    params: z.object({
      id: z.uuid(),
    }),
    body: {
      ...jsonContent(commitAccountsSchema, "Selected accounts to save"),
      required: true,
    },
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(
      commitAccountsResponseSchema,
      "Accounts persisted; connection marked as connected",
    ),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ error: z.string() }),
      "Invalid payload or connection not pending",
    ),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
    [HTTPStatusCodes.NOT_FOUND]: jsonContent(z.object({ error: z.string() }), "Connection not found"),
  },
});

export type CommitAccountsRoute = typeof commitAccounts;

export const toggleBankAccount = createRoute({
  tags,
  path: "/banking/accounts/{id}",
  method: "patch",
  summary: "Enable or disable a bank account",
  request: {
    params: z.object({
      id: z.uuid(),
    }),
    body: {
      ...jsonContent(z.object({ enabled: z.boolean() }), "Enabled flag"),
      required: true,
    },
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(
      z.object({
        id: z.uuid(),
        enabled: z.boolean(),
      }),
      "Account flag updated",
    ),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(z.object({ error: z.string() }), "No active space"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
    [HTTPStatusCodes.NOT_FOUND]: jsonContent(z.object({ error: z.string() }), "Account not found"),
  },
});

export type ToggleBankAccountRoute = typeof toggleBankAccount;
