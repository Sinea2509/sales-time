import { notFound, redirect } from "next/navigation";
import { TeamMemberPerformanceShell } from "@/components/organisms/team-member-performance-shell";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadTeamMemberPerformanceView } from "@/lib/team-member-performance-view";
import { resolveManagerTeamUserIds } from "@/lib/team-seller-scope";
import {
  DEFAULT_STATS_WINDOW_DAYS,
  parseStatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import { pathWithStatsWindow } from "@/lib/resolve-stats-window-days";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ userId: string }>;
  /**
   * `equipePage` n'est pas lu par cette page : il n'y sert qu'à la retenir, le
   * temps d'un aller-retour, pour que le lien de retour rende au manager la
   * page de liste d'où il vient plutôt que la première.
   */
  searchParams?: Promise<{ jours?: string; equipePage?: string }>;
};

export default async function ManagerCommercialViewPage({
  params,
  searchParams,
}: Props) {
  const { userId } = await params;
  const sp = searchParams != null ? await searchParams : {};
  const joursParam = Array.isArray(sp.jours) ? sp.jours[0] : sp.jours;
  if (joursParam === String(DEFAULT_STATS_WINDOW_DAYS)) {
    // La période par défaut se dit par son absence, mais le reste de la requête
    // survit à ce nettoyage : sans cela, écrire la période courante dans
    // l'adresse suffisait à perdre la page de liste.
    redirect(pathWithStatsWindow(`/company/equipe/${userId}`, sp, null));
  }
  const statsWindowDays = parseStatsWindowDays(sp.jours);
  const retourEquipeHref = pathWithStatsWindow(
    "/company/equipe",
    { equipePage: sp.equipePage },
    statsWindowDays,
  );

  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }
  if (actor.workspaceRoleMode !== "admin") {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const orgId = actor.activeOrganizationId;

  // Le rang est relatif : il se calcule sur l'équipe que ce manager a le droit
  // de voir, exactement comme le tableau « Mon équipe » d'où l'on arrive. Sans
  // ce cadrage, la fiche annoncerait une place calculée sur un autre groupe.
  const teamUserIds = await resolveManagerTeamUserIds(deps, {
    canManageOrganization: actor.canManageOrganization,
    internalUserId: actor.internalUserId,
  });

  const chargement = await loadTeamMemberPerformanceView(deps, {
    organizationId: orgId,
    sellerUserId: userId,
    statsWindowDays,
    teamUserIds,
    audience: "manager",
  });
  /*
    Deux refus, deux issues différentes : un membre introuvable est une adresse
    qui ne désigne personne, et un tableau de bord absent est une organisation
    que cette page ne sait pas lire, d'où l'on repart par l'accueil.
  */
  if (!chargement.ok) {
    if (chargement.raison === "membre-introuvable") notFound();
    redirect("/company");
  }

  return (
    <TeamMemberPerformanceShell
      {...chargement.view}
      backHref={retourEquipeHref}
    />
  );
}
