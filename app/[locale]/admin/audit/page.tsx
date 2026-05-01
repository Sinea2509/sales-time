import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";
import { AdminAuditLog } from "@/components/organisms/admin-audit-log";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const serialized =
    await getApplicationDeps().backoffice.listGlobalAuditLogs(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClass}>Journal d&apos;audit</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Historique des actions effectuées par les super administrateurs.
        </p>
      </div>
      <AdminAuditLog logs={serialized} />
    </div>
  );
}
