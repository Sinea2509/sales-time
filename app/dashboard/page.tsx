import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getOrgDashboardKpis } from "@/src/core/application/get-org-dashboard-kpis";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated") {
    redirect("/sign-in");
  }

  const kpis =
    actor.activeTenantClerkOrgId != null
      ? await getOrgDashboardKpis(makeApplicationDeps(), {
          clerkOrgId: actor.activeTenantClerkOrgId,
        })
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Indicateurs sur les 30 derniers jours (date du rendez-vous) pour
          l’organisation active.
        </p>
      </div>

      {!actor.activeTenantClerkOrgId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organisation</CardTitle>
            <CardDescription>
              Sélectionnez une organisation Clerk pour afficher les KPIs.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : !kpis ? null : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rendez-vous (30 j)</CardTitle>
              <CardDescription>Volume enregistré</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {kpis.meetingsLast30d}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Taux de gain</CardTitle>
              <CardDescription>Résultat « Gagné » / total</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {kpis.winRatePercent === null ? "—" : `${kpis.winRatePercent}%`}
              </p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">SONCAS — dominants</CardTitle>
              <CardDescription>
                Dernière analyse SONCAS par rendez-vous (période glissante)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  Object.entries(kpis.soncasDominantCounts) as Array<
                    [string, number]
                  >
                ).map(([k, v]) => (
                  <li
                    key={k}
                    className="bg-muted/40 flex justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="capitalize">{k}</span>
                    <span className="font-medium tabular-nums">{v}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">DISC — dominants</CardTitle>
              <CardDescription>
                Dernière analyse DISC par rendez-vous
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["D", "I", "S", "C"] as const).map((k) => (
                  <li
                    key={k}
                    className="bg-muted/40 flex justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span>{k}</span>
                    <span className="font-medium tabular-nums">
                      {kpis.discDominantCounts[k]}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
