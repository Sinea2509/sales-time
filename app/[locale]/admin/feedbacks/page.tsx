import { getApplicationDeps } from "@/lib/application-deps";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { PrdEmptyState } from "@/components/molecules/prd-empty-state";
import { AdminFeedbacksStatusTabs } from "@/components/molecules/admin-feedbacks-status-tabs";
import { AdminFeedbacksInbox } from "@/components/organisms/admin-feedbacks-inbox";
import {
  feedbackStatusForQuery,
  parseFeedbackStatusFilter,
} from "@/lib/feedback-status-filter";

export const dynamic = "force-dynamic";

type AdminFeedbacksPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function AdminFeedbacksPage({
  searchParams,
}: AdminFeedbacksPageProps) {
  const sp = searchParams != null ? await searchParams : {};
  const statusFilter = parseFeedbackStatusFilter(sp.status);
  const status = feedbackStatusForQuery(statusFilter);

  const deps = getApplicationDeps();
  const [statusCounts, { rows }] = await Promise.all([
    deps.feedbacks.countGroupedByStatus(),
    deps.feedbacks.list({
      status,
      limit: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="Feedbacks"
        description="Retours utilisateurs avec contexte technique et export Cursor."
      />
      <AdminFeedbacksStatusTabs
        activeStatus={statusFilter}
        counts={statusCounts}
      />
      {rows.length === 0 ? (
        <PrdEmptyState
          title="Aucun feedback"
          description={
            statusFilter === "ALL"
              ? "Les retours soumis via le widget apparaîtront ici."
              : "Aucun retour pour ce statut."
          }
        />
      ) : (
        <AdminFeedbacksInbox rows={rows} />
      )}
    </div>
  );
}
