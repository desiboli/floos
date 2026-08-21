import { env } from "@floos/env/server";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { relations } from "./relations";

export function createDb() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  return drizzle({ client: pool, relations });
}

export const db = createDb();

export type Database = ReturnType<typeof createDb>;
