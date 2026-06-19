import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  return envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
  });
}

let cached: Env | null = null;

/** Safe for client: only exposes NEXT_PUBLIC_* via separate getters elsewhere. */
export function getEnv(): Env {
  if (!cached) {
    cached = parseEnv();
  }
  return cached;
}

export function requireDatabaseUrl(): string {
  const e = getEnv();
  if (!e.DATABASE_URL) throw new Error("DATABASE_URL is required");
  return e.DATABASE_URL;
}

/** Required when calling Vercel AI Gateway (meeting analysis). */
export function requireAiGatewayApiKey(): string {
  const e = getEnv();
  if (!e.AI_GATEWAY_API_KEY) {
    throw new Error("AI_GATEWAY_API_KEY is required for AI analysis");
  }
  return e.AI_GATEWAY_API_KEY;
}

export type AiGatewayConfigured =
  | { ok: true; apiKey: string }
  | { ok: false; error: "AI_NOT_CONFIGURED" };

/** Non-throwing check for server actions and workers. */
export function checkAiGatewayConfigured(): AiGatewayConfigured {
  const key = getEnv().AI_GATEWAY_API_KEY;
  if (!key) {
    return { ok: false, error: "AI_NOT_CONFIGURED" };
  }
  return { ok: true, apiKey: key };
}
