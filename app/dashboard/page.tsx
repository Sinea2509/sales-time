import { redirect } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardHomeShell } from "@/components/organisms/dashboard-home-shell";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { parseStatsWindowDays } from "@/lib/dashboard-stats-window";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<{ jours?: string }>;
};

export default async function DashboardHomePage({
  searchParams,
}: DashboardPageProps) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated") {
    redirect("/sign-in");
  }

  const sp = searchParams != null ? await searchParams : {};
  const statsWindowDays = parseStatsWindowDays(sp.jours);

  const home =
    actor.activeTenantClerkOrgId != null
      ? await getOrgDashboardHome(makeApplicationDeps(), {
          clerkOrgId: actor.activeTenantClerkOrgId,
          statsWindowDays,
        })
      : null;

  return (
    <div className="space-y-6">
      {!actor.activeTenantClerkOrgId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organisation</CardTitle>
            <CardDescription>
              Sélectionnez une organisation Clerk pour afficher les indicateurs.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : !home ? null : (
        <DashboardHomeShell home={home} />
      )}
    </div>
  );
}
