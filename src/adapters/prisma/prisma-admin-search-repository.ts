import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { AdminSearchRepositoryPort } from "@/src/core/ports/admin-search-repository-port";

export class PrismaAdminSearchRepository implements AdminSearchRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async searchUsersAndOrganizations(query: string): Promise<{
    users: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    }[];
    organizations: { id: string; name: string; slug: string | null }[];
  }> {
    const q = query.trim();
    const [users, organizations] = await Promise.all([
      this.db.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, email: true, firstName: true, lastName: true },
        take: 5,
      }),
      this.db.organization.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, slug: true },
        take: 5,
      }),
    ]);
    return { users, organizations };
  }
}
