import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";
import { AdminOrgTable } from "@/components/organisms/admin-org-table";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage() {
  const serialized =
    await getApplicationDeps().backoffice.listOrganizationsForAdminTable();

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClass}>Organisations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gérer toutes les organisations de la plateforme. Créer, modifier ou
          supprimer des organisations.
        </p>
      </div>
      <AdminOrgTable organizations={serialized} />
    </div>
  );
}
