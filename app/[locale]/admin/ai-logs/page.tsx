import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";
import { AdminAiLogsTable } from "@/components/organisms/admin-ai-logs-table";

export const dynamic = "force-dynamic";

export default async function AdminAiLogsPage() {
  const { rows } = await getApplicationDeps().aiLogs.listLogs({ limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClass}>Logs IA</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Inspection des prompts, outputs, tokens et rejeu pour debug.
        </p>
      </div>
      <AdminAiLogsTable rows={rows} />
    </div>
  );
}
