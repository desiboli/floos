import { db } from "@floos/db";
import { getCategories } from "@floos/db/queries";
import { tool } from "ai";
import { z } from "zod";

import type { FloosAgentContext } from "../types";

export function categoriesListTool(ctx: FloosAgentContext) {
  return tool({
    description:
      "List transaction categories for the active space: id, slug, name, parent slug, and whether the category is excluded from spending totals.",
    inputSchema: z.object({}),
    outputSchema: z.object({
      categories: z.array(
        z.object({
          id: z.uuid(),
          slug: z.string(),
          name: z.string(),
          parentSlug: z.string().nullable(),
          excluded: z.boolean(),
        }),
      ),
    }),
    execute: async () => {
      const tree = await getCategories(db, ctx.spaceId);
      const categories = tree.flatMap((parent) => [
        {
          id: parent.id,
          slug: parent.slug,
          name: parent.name,
          parentSlug: null,
          excluded: parent.excluded,
        },
        ...parent.children.map((child) => ({
          id: child.id,
          slug: child.slug,
          name: child.name,
          parentSlug: parent.slug,
          excluded: child.excluded,
        })),
      ]);
      return { categories };
    },
  });
}
