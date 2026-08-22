import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_SUCCESS_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // Resend (invite emails). Set in apps/server/.env — jobs load that file.
    // Optional in development (job skips send); required in production.
    RESEND_API_KEY:
      process.env.NODE_ENV === "production" ? z.string().min(1) : z.string().min(1).optional(),
    EMAIL_FROM:
      process.env.NODE_ENV === "production" ? z.string().min(1) : z.string().min(1).optional(),
    TRIGGER_SECRET_KEY: z.string().min(1),
    // GoCardless Bank Account Data (AIS) — not the payments API
    GOCARDLESS_SECRET_ID: z.string().min(1),
    GOCARDLESS_SECRET_KEY: z.string().min(1),
    // Enable Banking — JWT auth (app id = kid, PEM private key)
    ENABLEBANKING_APP_ID: z.uuid(),
    ENABLEBANKING_PRIVATE_KEY: z
      .string()
      .min(1)
      .transform((key) => key.replace(/\\n/g, "\n")),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
