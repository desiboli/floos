import { z } from "zod";

export const floosAgentContextSchema = z.object({
  userId: z.string(),
  userName: z.string().nullable(),
  spaceId: z.uuid(),
  spaceName: z.string(),
  currency: z.string(),
  country: z.string(),
  timezone: z.string(),
  locale: z.string(),
  localTimeIso: z.string(),
  hasBankAccounts: z.boolean(),
});

export type FloosAgentContext = z.infer<typeof floosAgentContextSchema>;

export const createAiSessionResponseSchema = z.object({
  chatId: z.uuid(),
  triggerSessionId: z.string(),
  publicAccessToken: z.string(),
  messages: z.array(z.unknown()),
  title: z.string().nullable(),
  lastEventId: z.string().nullable(),
});

export type CreateAiSessionResponse = z.infer<typeof createAiSessionResponseSchema>;

export const floosAgentClientDataSchema = z
  .object({
    timezone: z.string().min(1).optional(),
    locale: z.string().min(1).optional(),
  })
  .catch({});

export type FloosAgentClientData = z.infer<typeof floosAgentClientDataSchema>;
