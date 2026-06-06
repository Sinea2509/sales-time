import { getApplicationDeps } from "@/lib/application-deps";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { AdminOrgTable } from "@/components/organisms/admin-org-table";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage() {
  const serialized =
    await getApplicationDeps().backoffice.listOrganizationsForAdminTable();

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="Organisations"
        description="Gérer toutes les organisations de la plateforme. Créer, modifier ou supprimer des organisations."
      />
      <AdminOrgTable organizations={serialized} />
    </div>
  );
}
