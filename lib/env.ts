import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),
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
  });
}

let cached: Env | null = null;

/** Safe for client: only exposes NEXT_PUBLIC_* via separate getters elsewhere. */
export function getEnv(): Env {
  if (cached) return cached;
  cached = parseEnv();
  return cached;
}

/** Throws if required server env vars are missing (use in server-only code paths). */
export function requireServerEnv(): Required<
  Pick<
    Env,
    | "DATABASE_URL"
    | "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    | "CLERK_SECRET_KEY"
  >
> {
  const e = getEnv();
  if (!e.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!e.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required");
  }
  if (!e.CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is required");
  return e as Required<
    Pick<
      Env,
      "DATABASE_URL" | "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | "CLERK_SECRET_KEY"
    >
  >;
}
