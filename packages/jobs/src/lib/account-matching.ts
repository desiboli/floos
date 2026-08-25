import type { Account } from "@floos/banking";
import { remapBankAccountProviderIds } from "@floos/db/queries";
import type { Database } from "@floos/db";
import type { BankAccount } from "@floos/db/schema";
import { logger } from "@trigger.dev/sdk";

type ExistingAccount = Pick<BankAccount, "id" | "iban" | "type" | "currency" | "name">;

function sameCurrency(left: string, right: string) {
  if (left.toUpperCase() === "XXX" || right.toUpperCase() === "XXX") return true;
  return left === right;
}

/** 0 matches → null. 1 match → that row. Many → unique name, else null. Never guesses. */
function pickUnique(candidates: ExistingAccount[], name: string) {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0] ?? null;

  const named = candidates.filter((row) => row.name.toLowerCase() === name.toLowerCase());
  if (named.length === 1) return named[0] ?? null;
  return null;
}

function findMatch(incoming: Account, available: ExistingAccount[]) {
  if (incoming.iban) {
    const byIban = available.filter((row) => row.iban === incoming.iban);
    const picked = pickUnique(byIban, incoming.name);
    if (picked) return picked;
  }

  return pickUnique(
    available.filter(
      (row) => sameCurrency(row.currency, incoming.currency) && row.type === incoming.type,
    ),
    incoming.name,
  );
}

/**
 * Map live provider accounts onto existing Floos rows and rewrite `accountId`.
 * IBAN first, then currency + type (name as a tie-break).
 */
export async function matchAndUpdateAccountIds(
  db: Database,
  existingAccounts: ExistingAccount[],
  apiAccounts: Account[],
  connectionId: string,
) {
  const claimed = new Set<string>();
  const remaps: Array<{ id: string; accountId: string; iban: string | null }> = [];

  for (const incoming of apiAccounts) {
    const match = findMatch(
      incoming,
      existingAccounts.filter((row) => !claimed.has(row.id)),
    );

    if (!match) {
      logger.warn("No matching bank account for provider account", {
        connectionId,
        iban: incoming.iban,
        type: incoming.type,
        currency: incoming.currency,
        name: incoming.name,
      });
      continue;
    }

    claimed.add(match.id);
    remaps.push({ id: match.id, accountId: incoming.id, iban: incoming.iban });
  }

  await remapBankAccountProviderIds(db, remaps);

  logger.info("Account matching complete", {
    connectionId,
    matched: remaps.length,
    unmatchedApi: apiAccounts.length - remaps.length,
    unmatchedDb: existingAccounts.length - remaps.length,
  });
}
