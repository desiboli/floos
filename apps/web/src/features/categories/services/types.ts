import type { InferResponseType } from "hono/client";

import { api } from "@/lib/api-client";

export type CategoriesResult = InferResponseType<typeof api.categories.$get, 200>;
export type CategoryTree = CategoriesResult["categories"][number];
export type Category = CategoryTree["children"][number];
export type CategoryRecord = Omit<CategoryTree, "children">;
