import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  OrganizationDirectoryPort,
  OrganizationSummary,
} from "@/src/core/ports/organization-directory-port";

export function makePrismaOrganizationDirectoryPort(
  db: PrismaClient,
): OrganizationDirectoryPort {
  return {
    async listOrganizations({ limit }): Promise<OrganizationSummary[]> {
      const rows = await db.organization.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          settings: { select: { logoUrl: true } },
        },
      });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        logoUrl: r.settings?.logoUrl ?? null,
      }));
    },

    async getOrganizationById(id: string): Promise<OrganizationSummary | null> {
      const row = await db.organization.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          slug: true,
          settings: { select: { logoUrl: true } },
        },
      });
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        logoUrl: row.settings?.logoUrl ?? null,
      };
    },
  };
}
