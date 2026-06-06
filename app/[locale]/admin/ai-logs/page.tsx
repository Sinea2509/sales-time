import { getApplicationDeps } from "@/lib/application-deps";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { AdminAiLogsTable } from "@/components/organisms/admin-ai-logs-table";

export const dynamic = "force-dynamic";

export default async function AdminAiLogsPage() {
  const { rows } = await getApplicationDeps().aiLogs.listLogs({ limit: 100 });

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="Logs IA"
        description="Inspection des prompts, outputs, tokens et rejeu pour debug."
      />
      <AdminAiLogsTable rows={rows} />
    </div>
  );
}
