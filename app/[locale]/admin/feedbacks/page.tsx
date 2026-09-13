import { Suspense } from "react";
import { getApplicationDeps } from "@/lib/application-deps";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { PrdEmptyState } from "@/components/molecules/prd-empty-state";
import { AdminFeedbacksStatusTabs } from "@/components/molecules/admin-feedbacks-status-tabs";
import { AdminFeedbacksFilters } from "@/components/molecules/admin-feedbacks-filters";
import { AdminFeedbacksInbox } from "@/components/organisms/admin-feedbacks-inbox";
import { buildFeedbackListFilters } from "@/lib/feedback-list-filters";
import {
  feedbackStatusForQuery,
  parseFeedbackStatusFilter,
} from "@/lib/feedback-status-filter";

export const dynamic = "force-dynamic";

type AdminFeedbacksPageProps = {
  searchParams?: Promise<{
    status?: string;
    type?: string;
    priority?: string;
    hasScreenshot?: string;
    hasTargetElement?: string;
  }>;
};

export default async function AdminFeedbacksPage({
  searchParams,
}: AdminFeedbacksPageProps) {
  const sp = searchParams != null ? await searchParams : {};
  const statusFilter = parseFeedbackStatusFilter(sp.status);
  const status = feedbackStatusForQuery(statusFilter);
  const listFilters = buildFeedbackListFilters(sp);

  const deps = getApplicationDeps();
  const [statusCounts, { rows }] = await Promise.all([
    deps.feedbacks.countGroupedByStatus(),
    deps.feedbacks.list({
      status,
      type: listFilters.type ?? undefined,
      priority: listFilters.priority ?? undefined,
      hasScreenshot: listFilters.hasScreenshot,
      hasTargetElement: listFilters.hasTargetElement,
      limit: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="Feedbacks"
        description="Retours utilisateurs avec élément ciblé, captures, et export prêt à coller dans un outil de développement."
      />
      <AdminFeedbacksStatusTabs
        activeStatus={statusFilter}
        counts={statusCounts}
      />
      <Suspense fallback={null}>
        <AdminFeedbacksFilters />
      </Suspense>
      {rows.length === 0 ? (
        <PrdEmptyState
          title="Aucun feedback"
          description={
            statusFilter === "ALL"
              ? "Les retours soumis via le widget apparaîtront ici."
              : "Aucun retour pour ces filtres."
          }
        />
      ) : (
        <AdminFeedbacksInbox rows={rows} />
      )}
    </div>
  );
}
