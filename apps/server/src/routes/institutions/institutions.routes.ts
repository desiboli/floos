import { createRoute, z } from "@hono/zod-openapi";

import * as HTTPStatusCodes from "../../http-status-codes";
import jsonContent from "../../openapi/helpers/json-content";

const tags = ["Institutions"];

export const institutionItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().nullable(),
  provider: z.enum(["gocardless", "enablebanking"]),
  countries: z.array(z.string()),
  availableHistory: z.number().nullable(),
  psuType: z.string().nullable(),
});

export const listInstitutionsResponseSchema = z.object({
  institutions: z.array(institutionItemSchema),
});

export const list = createRoute({
  tags,
  path: "/institutions",
  method: "get",
  summary: "List institutions for a country",
  request: {
    query: z.object({
      country: z.string().length(2).openapi({
        example: "SE",
        description: "ISO 3166-1 alpha-2 country code",
      }),
    }),
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(
      listInstitutionsResponseSchema,
      "Institutions available in the country",
    ),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
  },
});

export type ListRoute = typeof list;
