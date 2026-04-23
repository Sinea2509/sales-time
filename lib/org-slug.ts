import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@/lib/generated/prisma/client";

export async function uniqueOrganizationSlug(
  db: PrismaClient,
  companyName: string,
): Promise<string> {
  const base =
    companyName
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "org";
  for (let i = 0; i < 30; i++) {
    const candidate =
      i === 0 ? base : `${base}-${randomBytes(3).toString("hex")}`;
    const exists = await db.organization.findUnique({
      where: { slug: candidate },
    });
    if (!exists) return candidate;
  }
  return `${base}-${randomBytes(8).toString("hex")}`;
}
