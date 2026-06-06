import { getApplicationDeps } from "@/lib/application-deps";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { PrdEmptyState } from "@/components/molecules/prd-empty-state";
import { AdminFeedbacksInbox } from "@/components/organisms/admin-feedbacks-inbox";

export const dynamic = "force-dynamic";

export default async function AdminFeedbacksPage() {
  const { rows } = await getApplicationDeps().feedbacks.list({
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="Feedbacks"
        description="Retours utilisateurs avec contexte technique et export Cursor."
      />
      {rows.length === 0 ? (
        <PrdEmptyState
          title="Aucun feedback"
          description="Les retours soumis via le widget apparaîtront ici."
        />
      ) : (
        <AdminFeedbacksInbox rows={rows} />
      )}
    </div>
  );
}
