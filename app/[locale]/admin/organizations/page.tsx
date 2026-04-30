import { prisma } from "@/lib/prisma";
import { AdminOrgTable } from "@/components/admin/admin-org-table";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      websiteNormalized: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          memberships: true,
          meetings: true,
          invitations: true,
        },
      },
    },
  });

  const serialized = organizations.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    website: o.websiteNormalized,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    memberCount: o._count.memberships,
    meetingCount: o._count.meetings,
    invitationCount: o._count.invitations,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organisations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gérer toutes les organisations de la plateforme. Créer, modifier ou supprimer des organisations.
        </p>
      </div>
      <AdminOrgTable organizations={serialized} />
    </div>
  );
}
