import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { AdminOrganizationDetailShell } from "@/components/organisms/admin-organization-detail-shell";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const deps = getApplicationDeps();
  const org = await deps.backoffice.getOrganizationDetailForAdmin(id);

  if (!org) {
    redirect("/admin/organizations");
  }

  const [analysesCount, auditLogs] = await Promise.all([
    deps.backoffice.countMeetingAnalysesForOrganization(id),
    deps.backoffice.listAuditLogsForOrganization(id, 20),
  ]);

  return (
    <AdminOrganizationDetailShell
      org={org}
      analysesCount={analysesCount}
      auditLogs={auditLogs}
    />
  );
}
