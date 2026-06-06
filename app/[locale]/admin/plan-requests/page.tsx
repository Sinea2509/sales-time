import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";
import { AdminPlanRequestsTable } from "@/components/organisms/admin-plan-requests-table";

export const dynamic = "force-dynamic";

export default async function AdminPlanRequestsPage() {
  const rows = await getApplicationDeps().planRequests.listByStatus(null, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClass}>Demandes d&apos;upgrade</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Inbox des demandes de passage au plan payant.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucune demande.</p>
      ) : (
        <AdminPlanRequestsTable rows={rows} />
      )}
    </div>
  );
}
