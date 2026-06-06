import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";
import { AdminFeedbacksInbox } from "@/components/organisms/admin-feedbacks-inbox";

export const dynamic = "force-dynamic";

export default async function AdminFeedbacksPage() {
  const { rows } = await getApplicationDeps().feedbacks.list({
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClass}>Feedbacks</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Retours utilisateurs avec contexte technique et export Cursor.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun feedback.</p>
      ) : (
        <AdminFeedbacksInbox rows={rows} />
      )}
    </div>
  );
}
