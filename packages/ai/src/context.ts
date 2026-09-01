import { db } from "@floos/db";
import {
  getAiChatById,
  getSpaceById,
  getSpaceMemberRole,
  getUserById,
  hasEnabledBankAccounts,
} from "@floos/db/queries";

import { floosAgentContextSchema, type FloosAgentContext } from "./types";

const DEFAULT_TIMEZONE = "UTC";
const DEFAULT_LOCALE = "en-US";

export function localTimeIsoInZone(timeZone: string): string {
  try {
    return new Date().toLocaleString("sv-SE", { timeZone }).replace(" ", "T");
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Resolve agent context from the persisted chat row.
 * Space and user come from Postgres, not from the browser.
 */
export async function resolveFloosAgentContext(input: {
  chatId: string;
  timezone?: string;
  locale?: string;
}): Promise<FloosAgentContext | null> {
  const chat = await getAiChatById(db, input.chatId);
  if (!chat) return null;

  const role = await getSpaceMemberRole(db, chat.spaceId, chat.userId);
  if (!role) return null;

  const [space, user, hasBankAccounts] = await Promise.all([
    getSpaceById(db, chat.spaceId),
    getUserById(db, chat.userId),
    hasEnabledBankAccounts(db, chat.spaceId),
  ]);

  if (!space) return null;

  const timezone = input.timezone?.trim() || DEFAULT_TIMEZONE;
  const locale = input.locale?.trim() || DEFAULT_LOCALE;

  return floosAgentContextSchema.parse({
    userId: chat.userId,
    userName: user?.name ?? null,
    spaceId: space.id,
    spaceName: space.name,
    currency: space.currency,
    country: space.country,
    timezone,
    locale,
    localTimeIso: localTimeIsoInZone(timezone),
    hasBankAccounts,
  });
}
