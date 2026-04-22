import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  return envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
  });
}

let cached: Env | null = null;

/** Safe for client: only exposes NEXT_PUBLIC_* via separate getters elsewhere. */
export function getEnv(): Env {
  if (cached) return cached;
  cached = parseEnv();
  return cached;
}

export function requireClerkKeys(): {
  publishableKey: string;
  secretKey: string;
} {
  const e = getEnv();
  if (!e.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required");
  }
  if (!e.CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is required");
  return {
    publishableKey: e.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: e.CLERK_SECRET_KEY,
  };
}

export function requireDatabaseUrl(): string {
  const e = getEnv();
  if (!e.DATABASE_URL) throw new Error("DATABASE_URL is required");
  return e.DATABASE_URL;
}

/** Throws if DB + Clerk keys are required together. */
export function requireServerEnv(): {
  databaseUrl: string;
  publishableKey: string;
  secretKey: string;
} {
  return {
    databaseUrl: requireDatabaseUrl(),
    ...requireClerkKeys(),
  };
}

/** Required when calling Vercel AI Gateway (meeting analysis). */
export function requireAiGatewayApiKey(): string {
  const e = getEnv();
  if (!e.AI_GATEWAY_API_KEY) {
    throw new Error("AI_GATEWAY_API_KEY is required for AI analysis");
  }
  return e.AI_GATEWAY_API_KEY;
}
