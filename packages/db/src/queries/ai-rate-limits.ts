import { sql } from "drizzle-orm";

import type { Database } from "..";

import { aiRateLimits } from "../schema/ai-rate-limits";

export const AI_RATE_LIMITS = {
  session: { limit: 60, windowMs: 60_000 },
  reset: { limit: 10, windowMs: 10 * 60_000 },
} as const;

export type AiRateLimitBucket = keyof typeof AI_RATE_LIMITS;

export type ConsumeAiRateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

export async function consumeAiRateLimit(
  db: Database,
  input: {
    userId: string;
    bucket: AiRateLimitBucket;
    limit: number;
    windowMs: number;
  },
): Promise<ConsumeAiRateLimitResult> {
  const nowMs = Date.now();
  const windowStartedAt = new Date(Math.floor(nowMs / input.windowMs) * input.windowMs);
  const retryAfterSec = Math.max(
    1,
    Math.ceil((windowStartedAt.getTime() + input.windowMs - nowMs) / 1000),
  );

  const [row] = await db
    .insert(aiRateLimits)
    .values({
      userId: input.userId,
      bucket: input.bucket,
      windowStartedAt,
      count: 1,
    })
    .onConflictDoUpdate({
      target: [aiRateLimits.userId, aiRateLimits.bucket, aiRateLimits.windowStartedAt],
      set: { count: sql`${aiRateLimits.count} + 1` },
    })
    .returning({ count: aiRateLimits.count });

  if (!row) {
    throw new Error("Failed to consume AI rate limit");
  }

  const allowed = row.count <= input.limit;
  return {
    allowed,
    remaining: allowed ? input.limit - row.count : 0,
    retryAfterSec,
  };
}
