import { createGoogle } from "@ai-sdk/google";
import { db } from "@floos/db";
import {
  ensureSystemCategoriesForSpace,
  getTransactionsForEnrichment,
  markTransactionsAsEnriched,
  updateTransactionEnrichments,
} from "@floos/db/queries";
import { env } from "@floos/env/server";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateText, Output } from "ai";
import { z } from "zod";

import { generateEnrichmentPrompt } from "../lib/enrichment-prompt";
import { enrichmentSchema, prepareUpdateData } from "../lib/enrichment-schema";

const BATCH_SIZE = 50;

const google = createGoogle({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const enrichTransactionsTask = schemaTask({
  id: "enrich-transactions",
  schema: z.object({
    spaceId: z.uuid(),
    transactionIds: z.array(z.uuid()).optional(),
  }),
  maxDuration: 300,
  queue: { concurrencyLimit: 2 },
  run: async ({ spaceId, transactionIds }) => {
    await ensureSystemCategoriesForSpace(db, spaceId);

    const pending = await getTransactionsForEnrichment(db, {
      spaceId,
      transactionIds,
    });

    if (pending.length === 0) {
      logger.info("No transactions need enrichment", { spaceId });
      return { enriched: 0 };
    }

    logger.info("Starting enrichment", {
      spaceId,
      count: pending.length,
    });

    let enriched = 0;

    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);
      const batchIds = batch.map((tx) => tx.id);

      try {
        const { output } = await generateText({
          model: google("gemini-3.5-flash-lite"),
          output: Output.array({ element: enrichmentSchema }),
          temperature: 0.1,
          prompt: generateEnrichmentPrompt(batch),
        });

        if (!output || output.length !== batch.length) {
          throw new Error(
            `Enrichment result length mismatch: expected ${batch.length}, got ${output?.length ?? 0}`,
          );
        }

        await updateTransactionEnrichments(db, {
          spaceId,
          updates: batch.map((tx, index) => ({
            id: tx.id,
            ...prepareUpdateData(tx, output[index]!),
          })),
        });

        enriched += batch.length;

        logger.info("Enriched batch", {
          spaceId,
          batchSize: batch.length,
          enriched,
        });
      } catch (error) {
        logger.error("Failed to enrich transaction batch", {
          spaceId,
          batchSize: batch.length,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        await markTransactionsAsEnriched(db, { spaceId, ids: batchIds });
        enriched += batch.length;
      }
    }

    logger.info("Enrichment finished", { spaceId, enriched });
    return { enriched };
  },
});
