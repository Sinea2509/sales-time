import { Suspense } from "react";
import { redirect } from "next/navigation";
import { InfoCard } from "@/components/molecules/info-card";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { MonEquipeSection } from "@/components/organisms/mon-equipe-section";
import { Skeleton } from "@/components/ui/skeleton";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { getApplicationDeps } from "@/lib/application-deps";
import { resolveManagerTeamUserIds } from "@/lib/team-seller-scope";
import { getOrgAdminDashboard } from "@/src/core/application/get-org-admin-dashboard";
import { getStatsWindowRdvsCounts } from "@/src/core/application/get-stats-window-availability";
import {
  disabledStatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import { ensureEligibleStatsWindowDays } from "@/lib/resolve-stats-window-days";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ jours?: string; equipePage?: string }>;
};

function parseEquipePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export default async function MonEquipePage({ searchParams }: Props) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated") {
    redirect("/sign-in");
  }
  if (actor.workspaceRoleMode !== "admin") {
    redirect("/company");
  }
  if (!actor.activeOrganizationId) {
    return (
      <div className="space-y-6">
        <PageHeaderSimple title="Mon équipe" />
        <InfoCard
          title="Organisation"
          description="Sélectionnez une organisation pour afficher votre équipe."
        />
      </div>
    );
  }

  const sp = searchParams != null ? await searchParams : {};
  const monEquipePage = parseEquipePage(sp.equipePage);
  const deps = getApplicationDeps();

  const windowCounts = await getStatsWindowRdvsCounts(deps, {
    organizationId: actor.activeOrganizationId,
  });
  const statsWindowDays = ensureEligibleStatsWindowDays({
    joursParam: sp.jours,
    counts: windowCounts,
    redirectPath: "/company/equipe",
  });
  const disabledStatsDays = disabledStatsWindowDays(windowCounts);

  const teamUserIds = await resolveManagerTeamUserIds(deps, {
    canManageOrganization: actor.canManageOrganization,
    internalUserId: actor.internalUserId,
  });

  const admin = await getOrgAdminDashboard(deps, {
    organizationId: actor.activeOrganizationId,
    statsWindowDays,
    monEquipePage,
    teamUserIds,
  });

  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeaderSimple title="Mon équipe" />
        <InfoCard
          title="Équipe"
          description="Impossible de charger la liste des commerciaux."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeaderSimple title="Mon équipe" />
        <Suspense
          fallback={
            <Skeleton className="h-9 w-36 shrink-0 self-start rounded-md sm:self-auto" />
          }
        >
          <DashboardStatsPeriodSelect
            value={statsWindowDays}
            disabledDays={disabledStatsDays}
          />
        </Suspense>
      </div>
      <MonEquipeSection
        monEquipe={admin.monEquipe}
        statsWindowDays={statsWindowDays}
        currentUserEmail={actor.email}
      />
    </div>
  );
}
