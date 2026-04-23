import { ESTIMATED_TAM_EUR_PER_RDV } from "@/lib/dashboard-estimates";
import {
  averageSoncasDriverScores,
  type SoncasDriverAverages,
} from "@/lib/org-soncas-team-aggregate";
import type { MeetingOutcome } from "@/lib/generated/prisma/enums";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import { meetingAtSinceForStatsWindow, type StatsWindowDays } from "@/lib/dashboard-stats-window";
import { getOrgDashboardHome, type OrgDashboardHome } from "./get-org-dashboard-home";
import { getOrgDashboardKpis, type OrgDashboardKpis } from "./get-org-dashboard-kpis";

/** Limite de RDV chargés pour agrégations équipe (perf). */
export const ORG_ADMIN_DASHBOARD_MEETING_CAP = 5000;

export type OrgAdminTeamMemberRow = {
  sellerUserId: string;
  sellerEmail: string | null;
  nbRdvs: number;
  tamEstimeEur: number;
  wonCount: number;
  winRatePercent: number | null;
  avgSalesScore: number | null;
  tucOptimisePercent: number | null;
};

export type OrgAdminDashboard = {
  statsWindowDays: StatsWindowDays;
  home: OrgDashboardHome;
  kpis: OrgDashboardKpis;
  teamMembers: OrgAdminTeamMemberRow[];
  /** Moyenne SalesScore (0–100) sur les RDV analysés dans la fenêtre. */
  avgSalesScoreInWindow: number | null;
  /** Nombre de commerciaux ayant au moins un RDV dans la fenêtre. */
  activeCommercialsCount: number;
  /** Moyennes SONCAS sur tous les RDV de la fenêtre (dernière analyse par RDV déjà dans les lignes). */
  orgSoncasAverages: SoncasDriverAverages;
  progressBullets: string[];
  improvementBullets: string[];
  /** Échantillon RDV pour la matrice (perf UI). */
  scatterMatrixPoints: Array<{
    id: string;
    prospectName: string;
    salesScore: number | null;
    potentialEur: number;
    outcome: MeetingOutcome;
  }>;
};

function aggregateTeamMembers(
  meetings: Array<{
    sellerUserId: string;
    sellerEmail: string | null;
    outcome: MeetingOutcome;
    salesScore: number | null;
    hasSoncas: boolean;
    hasDisc: boolean;
  }>,
): OrgAdminTeamMemberRow[] {
  const bySeller = new Map<
    string,
    {
      sellerEmail: string | null;
      nb: number;
      won: number;
      scores: number[];
      withBoth: number;
    }
  >();

  for (const m of meetings) {
    const cur = bySeller.get(m.sellerUserId) ?? {
      sellerEmail: m.sellerEmail,
      nb: 0,
      won: 0,
      scores: [] as number[],
      withBoth: 0,
    };
    cur.nb += 1;
    if (m.sellerEmail) cur.sellerEmail = m.sellerEmail;
    if (m.outcome === "WON") cur.won += 1;
    if (m.salesScore != null) cur.scores.push(m.salesScore);
    if (m.hasSoncas && m.hasDisc) cur.withBoth += 1;
    bySeller.set(m.sellerUserId, cur);
  }

  const rows: OrgAdminTeamMemberRow[] = [];
  for (const [sellerUserId, v] of bySeller) {
    const winRatePercent =
      v.nb === 0 ? null : Math.round((100 * v.won) / v.nb);
    const avgSalesScore =
      v.scores.length === 0
        ? null
        : Math.round(
            (v.scores.reduce((a, b) => a + b, 0) / v.scores.length) * 10,
          ) / 10;
    const tucOptimisePercent =
      v.nb === 0 ? null : Math.round((100 * v.withBoth) / v.nb);
    rows.push({
      sellerUserId,
      sellerEmail: v.sellerEmail,
      nbRdvs: v.nb,
      tamEstimeEur: v.nb * ESTIMATED_TAM_EUR_PER_RDV,
      wonCount: v.won,
      winRatePercent,
      avgSalesScore,
      tucOptimisePercent,
    });
  }
  rows.sort((a, b) => b.nbRdvs - a.nbRdvs);
  return rows;
}

export function buildOrgAdminProgressBullets(home: OrgDashboardHome): string[] {
  const out: string[] = [];
  if (home.tamTrendPercent != null && home.tamTrendPercent > 0) {
    out.push(
      `TAM estimé en hausse de ${home.tamTrendPercent}% sur la période vs la fenêtre précédente.`,
    );
  }
  if (home.nbRdvsTrendPercent != null && home.nbRdvsTrendPercent > 0) {
    out.push(
      `Volume de rendez-vous en hausse de ${home.nbRdvsTrendPercent}% sur la période.`,
    );
  }
  if (home.tucTrendPoints != null && home.tucTrendPoints > 0) {
    out.push(
      `TUC optimisé : +${home.tucTrendPoints} points de pourcentage vs la période précédente.`,
    );
  }
  if (home.noteGlobaleTrendPoints != null && home.noteGlobaleTrendPoints > 0) {
    out.push(
      `Note globale moyenne : +${home.noteGlobaleTrendPoints} point(s) sur 5 vs la période précédente.`,
    );
  }
  if (out.length === 0) {
    out.push(
      "Poursuivez l’analyse des RDV pour enrichir les tendances d’équipe.",
    );
  }
  return out.slice(0, 5);
}

const DRIVER_LABEL_FR: Record<
  keyof SoncasDriverAverages,
  string
> = {
  securite: "Sécurité",
  orgueil: "Orgueil",
  nouveaute: "Nouveauté",
  confort: "Confort",
  argent: "Argent",
  sympathie: "Sympathie",
};

export function buildOrgAdminImprovementBullets(
  averages: SoncasDriverAverages,
): string[] {
  const entries = (
    Object.entries(averages) as Array<
      [keyof SoncasDriverAverages, number | null]
    >
  ).filter(([, v]) => v != null) as Array<[keyof SoncasDriverAverages, number]>;
  if (entries.length === 0) {
    return [
      "Ajoutez des analyses SONCAS sur les rendez-vous pour obtenir des axes d’amélioration ciblés.",
    ];
  }
  const mean =
    entries.reduce((acc, [, v]) => acc + v, 0) / entries.length;
  const weak = entries
    .filter(([, v]) => v < mean - 5 || v < 65)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);
  if (weak.length === 0) {
    return [
      "Les leviers SONCAS sont équilibrés sur la période — maintenez la régularité d’analyse.",
    ];
  }
  return weak.map(
    ([k, v]) =>
      `Renforcer le levier « ${DRIVER_LABEL_FR[k]} » (score moyen ${v}/100 sur l’équipe).`,
  );
}

export async function getOrgAdminDashboard(
  deps: { meetings: MeetingRepositoryPort },
  input: {
    clerkOrgId: string | null;
    statsWindowDays: StatsWindowDays;
  },
): Promise<OrgAdminDashboard | null> {
  if (!input.clerkOrgId) return null;

  const sinceCurrent = meetingAtSinceForStatsWindow(input.statsWindowDays);

  const [home, kpis, meetings] = await Promise.all([
    getOrgDashboardHome(deps, {
      clerkOrgId: input.clerkOrgId,
      statsWindowDays: input.statsWindowDays,
    }),
    getOrgDashboardKpis(deps, {
      clerkOrgId: input.clerkOrgId,
      meetingAtSince: sinceCurrent,
    }),
    deps.meetings.listRecentMeetingsForDashboard({
      clerkOrgId: input.clerkOrgId,
      limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
      meetingAtSince: sinceCurrent,
      includeLatestSoncasResult: true,
    }),
  ]);

  if (!home || !kpis) return null;

  const teamMembers = aggregateTeamMembers(meetings);
  const soncasResults = meetings
    .map((m) => m.latestSoncasResult)
    .filter((r): r is NonNullable<typeof r> => r != null);
  const orgSoncasAverages = averageSoncasDriverScores(soncasResults);

  const scoreVals = meetings
    .map((m) => m.salesScore)
    .filter((s): s is number => s != null);
  const avgSalesScoreInWindow =
    scoreVals.length === 0
      ? null
      : Math.round(
          (scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) * 10,
        ) / 10;

  const scatterMatrixPoints = meetings
    .slice(0, 200)
    .map((m) => ({
      id: m.id,
      prospectName: m.prospectName,
      salesScore: m.salesScore,
      potentialEur: ESTIMATED_TAM_EUR_PER_RDV,
      outcome: m.outcome,
    }));

  return {
    statsWindowDays: input.statsWindowDays,
    home,
    kpis,
    teamMembers,
    avgSalesScoreInWindow,
    activeCommercialsCount: teamMembers.length,
    orgSoncasAverages,
    progressBullets: buildOrgAdminProgressBullets(home),
    improvementBullets: buildOrgAdminImprovementBullets(orgSoncasAverages),
    scatterMatrixPoints,
  };
}
