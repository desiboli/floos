import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "@trigger.dev/sdk";

// jiti loads this file as CJS, so import.meta is unavailable. `trigger dev` runs from packages/jobs.
config({ path: resolve(process.cwd(), "../../apps/server/.env") });

export default defineConfig({
  project: "proj_zhuqusfaqdhpwxzjrpwn",
  dirs: ["./src/trigger"],
  maxDuration: 3600,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 2,
      factor: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      randomize: true,
    },
  },
});
