import { getApplicationDeps } from "@/lib/application-deps";
import { AdminAuditLog } from "@/components/organisms/admin-audit-log";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const serialized = await getApplicationDeps().backoffice.listGlobalAuditLogs(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Journal d&apos;audit
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Historique des actions effectuées par les super administrateurs.
        </p>
      </div>
      <AdminAuditLog logs={serialized} />
    </div>
  );
}
