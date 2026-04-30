import { prisma } from "@/lib/prisma";
import { AdminUserTable } from "@/components/admin/admin-user-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, organizations] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileRole: true,
        status: true,
        createdAt: true,
        systemRoles: { select: { role: true } },
        organizationMemberships: {
          select: {
            role: true,
            organization: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const serialized = users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    profileRole: u.profileRole,
    status: u.status as "ACTIVE" | "DISABLED",
    createdAt: u.createdAt.toISOString(),
    isSuperAdmin: u.systemRoles.some((r) => r.role === "SUPER_ADMIN"),
    memberships: u.organizationMemberships.map((m) => ({
      orgId: m.organization.id,
      orgName: m.organization.name,
      role: m.role as "ADMIN" | "MEMBER",
    })),
  }));

  const orgOptions = organizations.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gérer les utilisateurs, bloquer/débloquer, modifier les profils et inviter dans des organisations.
        </p>
      </div>
      <AdminUserTable users={serialized} organizations={orgOptions} />
    </div>
  );
}
