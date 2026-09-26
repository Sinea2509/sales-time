import { getApplicationDeps } from "@/lib/application-deps";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { AdminDemoOrganizationCard } from "@/components/organisms/admin-demo-organization-card";
import { AdminOrgTable } from "@/components/organisms/admin-org-table";
import { DEMO_ORG_SLUG } from "@/prisma/seed-demo-data";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage() {
  const serialized =
    await getApplicationDeps().backoffice.listOrganizationsForAdminTable();

  const demoRow = serialized.find((o) => o.slug === DEMO_ORG_SLUG) ?? null;

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="Organisations"
        description="Gérer toutes les organisations de la plateforme. Créer, modifier ou supprimer des organisations."
      />
      <AdminDemoOrganizationCard
        existing={
          demoRow
            ? {
                memberCount: demoRow.memberCount,
                meetingCount: demoRow.meetingCount,
              }
            : null
        }
      />
      <AdminOrgTable organizations={serialized} />
    </div>
  );
}
