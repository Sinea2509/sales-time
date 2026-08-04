import { getApplicationDeps } from "@/lib/application-deps";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { PrdEmptyState } from "@/components/molecules/prd-empty-state";
import { AdminPlanRequestsTable } from "@/components/organisms/admin-plan-requests-table";

export const dynamic = "force-dynamic";

export default async function AdminPlanRequestsPage() {
  const rows = await getApplicationDeps().planRequests.listByStatus(null, 100);

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="Demandes de changement de plan"
        description="Les demandes de passage au plan payant arrivent ici."
      />
      {rows.length === 0 ? (
        <PrdEmptyState
          title="Aucune demande"
          description="Les demandes envoyées par les organisations apparaîtront ici."
        />
      ) : (
        <AdminPlanRequestsTable rows={rows} />
      )}
    </div>
  );
}
