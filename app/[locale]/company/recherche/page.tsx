import { redirect } from "next/navigation";
import { GlobalSearchPanel } from "@/components/organisms/global-search-panel";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { requireDashboardActor } from "@/lib/dashboard-server-context";

export const dynamic = "force-dynamic";

export default async function RecherchePage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  return (
    <div className="space-y-6">
      <PageHeaderSimple title="Recherche" />
      <GlobalSearchPanel />
    </div>
  );
}
