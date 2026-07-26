import { Prisma } from "@/lib/generated/prisma/client";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { GlobalKissCoachingPromptsRepositoryPort } from "@/src/core/ports/global-kiss-coaching-prompts-repository-port";

const SINGLETON_ID = "default";

/** Postgres undefined_table : table absente (migration non appliquée). */
function isMissingGlobalKissTableError(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (e.code !== "P2010") return false;
  const m = e.message.toLowerCase();
  return (
    m.includes("42p01") ||
    m.includes("does not exist") ||
    m.includes("globalkisscoachingprompts")
  );
}

/**
 * Accès SQL direct sur `GlobalKissCoachingPrompts` (pas le délégué Prisma généré).
 * Si la table n’existe pas encore, `getPrompts` renvoie `null` (pas d’annexe KISS).
 */
export class PrismaGlobalKissCoachingPromptsRepository implements GlobalKissCoachingPromptsRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async getPrompts(): Promise<unknown | null> {
    try {
      const rows = await this.db.$queryRaw<Array<{ prompts: unknown }>>`
        SELECT "prompts" FROM "GlobalKissCoachingPrompts" WHERE "id" = ${SINGLETON_ID}
      `;
      if (rows.length === 0) {
        await this.db.$executeRaw`
          INSERT INTO "GlobalKissCoachingPrompts" ("id", "prompts", "updatedAt")
          VALUES (${SINGLETON_ID}, NULL, NOW())
          ON CONFLICT ("id") DO NOTHING
        `;
        const again = await this.db.$queryRaw<Array<{ prompts: unknown }>>`
          SELECT "prompts" FROM "GlobalKissCoachingPrompts" WHERE "id" = ${SINGLETON_ID}
        `;
        return again[0]?.prompts ?? null;
      }
      return rows[0]?.prompts ?? null;
    } catch (e) {
      if (isMissingGlobalKissTableError(e)) {
        return null;
      }
      throw e;
    }
  }

  async setPrompts(prompts: unknown | null): Promise<void> {
    try {
      if (prompts === null || prompts === undefined) {
        await this.db.$executeRaw`
          INSERT INTO "GlobalKissCoachingPrompts" ("id", "prompts", "updatedAt")
          VALUES (${SINGLETON_ID}, NULL, NOW())
          ON CONFLICT ("id") DO UPDATE SET
            "prompts" = NULL,
            "updatedAt" = NOW()
        `;
        return;
      }
      const serialized = JSON.stringify(prompts);
      await this.db.$executeRaw`
        INSERT INTO "GlobalKissCoachingPrompts" ("id", "prompts", "updatedAt")
        VALUES (${SINGLETON_ID}, ${serialized}::jsonb, NOW())
        ON CONFLICT ("id") DO UPDATE SET
          "prompts" = EXCLUDED."prompts",
          "updatedAt" = EXCLUDED."updatedAt"
      `;
    } catch (e) {
      if (isMissingGlobalKissTableError(e)) {
        throw new Error(
          "La table GlobalKissCoachingPrompts est absente. Exécutez les migrations : npx prisma migrate deploy",
        );
      }
      throw e;
    }
  }
}
