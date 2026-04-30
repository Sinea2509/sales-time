"use server";

import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";

async function requireSuperAdmin(): Promise<boolean> {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return false;
  const user = await prisma.user.findUnique({
    where: { id: principal.userId },
    select: { systemRoles: { select: { role: true } } },
  });
  return user?.systemRoles.some((r) => r.role === "SUPER_ADMIN") ?? false;
}

type SearchResult = {
  users: { id: string; email: string; firstName: string | null; lastName: string | null }[];
  organizations: { id: string; name: string; slug: string }[];
};

export async function searchAdminAction(query: string): Promise<SearchResult> {
  const allowed = await requireSuperAdmin();
  if (!allowed) return { users: [], organizations: [] };

  const q = query.trim();
  if (!q) return { users: [], organizations: [] };

  const [users, organizations] = await Promise.all([
    prisma.user.findMany({
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
    prisma.organization.findMany({
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
