import { getApplicationDeps } from "@/lib/application-deps";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { AdminAuditLog } from "@/components/organisms/admin-audit-log";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const serialized =
    await getApplicationDeps().backoffice.listGlobalAuditLogs(500);

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="Journal d'audit"
        description="Historique des actions plateforme : super admins, utilisateurs et organisations."
      />
      <AdminAuditLog logs={serialized} />
    </div>
  );
}
