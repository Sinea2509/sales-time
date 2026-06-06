import {
  computeTeamDiscPie,
  computeTeamSoncasPie,
} from "@/src/core/domain/org-profile-distribution-pie";
import { soncasResultSchema } from "@/src/core/domain/analysis-result-zod";
import { kissResultSchema } from "@/src/core/domain/kiss-result-zod";
import { kissCoachingBulletsFromMeetings } from "@/src/core/domain/kiss-coaching-bullets-from-meetings";
import type { SoncasDriverAverages } from "@/src/core/domain/org-soncas-team-aggregate";
import type {
  MeetingRepositoryPort,
  RecentMeetingListRow,
} from "@/src/core/ports/meeting-repository-port";
import type { OrganizationSettingsRepositoryPort } from "@/src/core/ports/organization-settings-repository-port";
import type { OrganizationTeamRepositoryPort } from "@/src/core/ports/organization-team-repository-port";
import {
  meetingAtSinceForStatsWindow,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import {
  getOrgDashboardHome,
  type OrgDashboardHome,
} from "./get-org-dashboard-home";
import {
  getOrgDashboardKpis,
  type OrgDashboardKpis,
} from "./get-org-dashboard-kpis";

/** Limite de RDV chargés pour agrégations équipe (perf). */
export const ORG_ADMIN_DASHBOARD_MEETING_CAP = 5000;

export const ORG_ADMIN_MON_EQUIPE_PAGE_SIZE = 10;

export type OrgAdminMonEquipeRow = {
  userId: string;
  membershipId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  nbRdvs: number;
  /** Nombre de RDV avec au moins une analyse KISS sur la période. */
  coachesCount: number;
  /** TAM — temps d'appel moyen (min) sur les RDV connectés du membre. */
  tamMinutesAvg: number | null;
  /** Levier SONCAS dominant le plus fréquent sur les RDV analysés (SONCAS) du membre. */
  postureLabel: string | null;
};

export type OrgAdminMonEquipePage = {
  page: number;
  pageSize: number;
  totalCount: number;
  rows: OrgAdminMonEquipeRow[];
};

export type OrgAdminPieSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export type OrgAdminDistributionPie = {
  /** RDV avec analyse valide pour ce graphique. */
  analyzedMeetings: number;
  /** Répartition égale indicative lorsqu'aucune analyse n'est disponible. */
  isDefaultEqual: boolean;
  slices: OrgAdminPieSlice[];
};

export type OrgAdminKissTeamRollup = {
  /** Nombre de RDV avec analyse KISS valide sur la période. */
  kissMeetingsCount: number;
  keepBullets: string[];
  improveBullets: string[];
  stopBullets: string[];
  startBullets: string[];
};

export type OrgAdminDashboard = {
  statsWindowDays: StatsWindowDays;
  home: OrgDashboardHome;
  kpis: OrgDashboardKpis;
  /** Moyenne SalesScore (0–100) sur les RDV analysés dans la fenêtre. */
  avgSalesScoreInWindow: number | null;
  /** Nombre de commerciaux ayant au moins un RDV dans la fenêtre. */
  activeCommercialsCount: number;
  monEquipe: OrgAdminMonEquipePage;
  discPie: OrgAdminDistributionPie;
  soncasPie: OrgAdminDistributionPie;
  kissTeamRollup: OrgAdminKissTeamRollup;
};

const DRIVER_LABEL_FR: Record<keyof SoncasDriverAverages, string> = {
  securite: "Sécurité",
  orgueil: "Orgueil",
  nouveaute: "Nouveauté",
  confort: "Confort",
  argent: "Argent",
  sympathie: "Sympathie",
};

function aggregateSellerWindowStats(
  meetings: RecentMeetingListRow[],
): Map<
  string,
  {
    nbRdvs: number;
    coachesCount: number;
    soncasDominants: string[];
    connectedDurationSum: number;
    connectedCount: number;
  }
> {
  const map = new Map<
    string,
    {
      nbRdvs: number;
      coachesCount: number;
      soncasDominants: string[];
      connectedDurationSum: number;
      connectedCount: number;
    }
  >();
  for (const row of meetings) {
    const cur = map.get(row.sellerUserId) ?? {
      nbRdvs: 0,
      coachesCount: 0,
      soncasDominants: [] as string[],
      connectedDurationSum: 0,
      connectedCount: 0,
    };
    cur.nbRdvs += 1;
    if (row.hasKiss) cur.coachesCount += 1;
    if (row.durationMin != null && row.durationMin > 0) {
      cur.connectedDurationSum += row.durationMin;
      cur.connectedCount += 1;
    }
    const parsed = soncasResultSchema.safeParse(row.latestSoncasResult);
    if (parsed.success) cur.soncasDominants.push(parsed.data.dominant);
    map.set(row.sellerUserId, cur);
  }
  return map;
}

function modeSoncasDominantLabel(dominants: string[]): string | null {
  if (dominants.length === 0) return null;
  const counts = new Map<string, number>();
  for (const d of dominants) {
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  let bestKey = dominants[0]!;
  let bestCount = -1;
  for (const [k, n] of counts) {
    if (
      n > bestCount ||
      (n === bestCount && k.localeCompare(bestKey, "fr") < 0)
    ) {
      bestCount = n;
      bestKey = k;
    }
  }
  const label =
    DRIVER_LABEL_FR[bestKey as keyof typeof DRIVER_LABEL_FR] ?? bestKey;
  return label;
}

function buildMonEquipePage(input: {
  members: Array<{
    membershipId: string;
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  }>;
  meetings: RecentMeetingListRow[];
  page: number;
}): OrgAdminMonEquipePage {
  const bySeller = aggregateSellerWindowStats(input.meetings);
  const rowsFull: OrgAdminMonEquipeRow[] = input.members.map((mem) => {
    const s = bySeller.get(mem.userId) ?? {
      nbRdvs: 0,
      coachesCount: 0,
      soncasDominants: [] as string[],
      connectedDurationSum: 0,
      connectedCount: 0,
    };
    const tamMinutesAvg =
      s.connectedCount > 0
        ? Math.round(s.connectedDurationSum / s.connectedCount)
        : null;
    return {
      userId: mem.userId,
      membershipId: mem.membershipId,
      firstName: mem.firstName,
      lastName: mem.lastName,
      email: mem.email,
      nbRdvs: s.nbRdvs,
      coachesCount: s.coachesCount,
      tamMinutesAvg,
      postureLabel: modeSoncasDominantLabel(s.soncasDominants),
    };
  });

  rowsFull.sort((a, b) => {
    if (b.nbRdvs !== a.nbRdvs) return b.nbRdvs - a.nbRdvs;
    const nameA =
      `${a.lastName ?? ""} ${a.firstName ?? ""}`
        .trim()
        .toLocaleLowerCase("fr") || a.email.toLocaleLowerCase("fr");
    const nameB =
      `${b.lastName ?? ""} ${b.firstName ?? ""}`
        .trim()
        .toLocaleLowerCase("fr") || b.email.toLocaleLowerCase("fr");
    return nameA.localeCompare(nameB, "fr");
  });

  const totalCount = rowsFull.length;
  const lastPage = Math.max(
    1,
    Math.ceil(totalCount / ORG_ADMIN_MON_EQUIPE_PAGE_SIZE),
  );
  const page = Math.min(lastPage, Math.max(1, input.page));
  const start = (page - 1) * ORG_ADMIN_MON_EQUIPE_PAGE_SIZE;
  const rows = rowsFull.slice(start, start + ORG_ADMIN_MON_EQUIPE_PAGE_SIZE);

  return {
    page,
    pageSize: ORG_ADMIN_MON_EQUIPE_PAGE_SIZE,
    totalCount,
    rows,
  };
}

const DISC_PIE_ORDER = ["D", "I", "S", "C"] as const;
const DISC_PIE_COLORS: Record<(typeof DISC_PIE_ORDER)[number], string> = {
  D: "#ef4444",
  I: "#3b82f6",
  S: "#22c55e",
  C: "#7c3aed",
};
const DISC_PIE_LABELS: Record<(typeof DISC_PIE_ORDER)[number], string> = {
  D: "D",
  I: "I",
  S: "S",
  C: "C",
};

const SONCAS_PIE_ORDER = [
  "securite",
  "orgueil",
  "nouveaute",
  "confort",
  "argent",
  "sympathie",
] as const;

const SONCAS_PIE_COLORS: Record<(typeof SONCAS_PIE_ORDER)[number], string> = {
  securite: "#6366f1",
  orgueil: "#ec4899",
  nouveaute: "#f97316",
  confort: "#14b8a6",
  argent: "#eab308",
  sympathie: "#06b6d4",
};

function buildDiscPie(
  meetings: RecentMeetingListRow[],
): OrgAdminDistributionPie {
  const pie = computeTeamDiscPie(
    meetings.map((m) => m.latestDiscResult).filter((r) => r != null),
  );
  const slices: OrgAdminPieSlice[] = DISC_PIE_ORDER.map((key) => ({
    id: key,
    label: DISC_PIE_LABELS[key],
    value: pie.values[key],
    color: DISC_PIE_COLORS[key],
  }));
  return {
    analyzedMeetings: pie.analyzedMeetings,
    isDefaultEqual: pie.isDefaultEqual,
    slices,
  };
}

function buildSoncasPie(
  meetings: RecentMeetingListRow[],
): OrgAdminDistributionPie {
  const pie = computeTeamSoncasPie(
    meetings.map((m) => m.latestSoncasResult).filter((r) => r != null),
  );
  const slices: OrgAdminPieSlice[] = SONCAS_PIE_ORDER.map((key) => ({
    id: key,
    label: DRIVER_LABEL_FR[key],
    value: pie.values[key],
    color: SONCAS_PIE_COLORS[key],
  }));
  return {
    analyzedMeetings: pie.analyzedMeetings,
    isDefaultEqual: pie.isDefaultEqual,
    slices,
  };
}

export function buildKissTeamRollupFromMeetings(
  meetings: RecentMeetingListRow[],
  bulletsPerQuadrant = 5,
): OrgAdminKissTeamRollup {
  let kissMeetingsCount = 0;
  for (const m of meetings) {
    const p = kissResultSchema.safeParse(m.latestKissResult);
    if (p.success) kissMeetingsCount += 1;
  }
  return {
    kissMeetingsCount,
    keepBullets: kissCoachingBulletsFromMeetings(
      meetings,
      "keep",
      bulletsPerQuadrant,
    ),
    improveBullets: kissCoachingBulletsFromMeetings(
      meetings,
      "improve",
      bulletsPerQuadrant,
    ),
    stopBullets: kissCoachingBulletsFromMeetings(
      meetings,
      "stop",
      bulletsPerQuadrant,
    ),
    startBullets: kissCoachingBulletsFromMeetings(
      meetings,
      "start",
      bulletsPerQuadrant,
    ),
  };
}

export function buildOrgAdminProgressBullets(home: OrgDashboardHome): string[] {
  const out: string[] = [];
  if (home.tamTrendPercent != null && home.tamTrendPercent > 0) {
    out.push(
      `TAM en hausse de ${home.tamTrendPercent}% sur la période vs la fenêtre précédente.`,
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
  const mean = entries.reduce((acc, [, v]) => acc + v, 0) / entries.length;
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
  deps: {
    meetings: MeetingRepositoryPort;
    organizationTeam: OrganizationTeamRepositoryPort;
    organizationSettings: OrganizationSettingsRepositoryPort;
  },
  input: {
    organizationId: string | null;
    statsWindowDays: StatsWindowDays;
    /** Pagination 1-based pour la section Mon équipe (10 par page). */
    monEquipePage?: number;
    /** When set, limits team dashboard to these seller user ids (manager scope). */
    teamUserIds?: string[];
  },
): Promise<OrgAdminDashboard | null> {
  if (!input.organizationId) return null;

  const sinceCurrent = meetingAtSinceForStatsWindow(input.statsWindowDays);

  const [home, kpis, meetings, teamList] = await Promise.all([
    getOrgDashboardHome(deps, {
      organizationId: input.organizationId,
      statsWindowDays: input.statsWindowDays,
    }),
    getOrgDashboardKpis(deps, {
      organizationId: input.organizationId,
      meetingAtSince: sinceCurrent,
    }),
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: input.organizationId,
      limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
      meetingAtSince: sinceCurrent,
      includeLatestSoncasResult: true,
      includeLatestDiscResult: true,
      includeLatestKissResult: true,
    }),
    deps.organizationTeam.listMembersAndPendingInvitations(
      input.organizationId,
    ),
  ]);

  if (!home || !kpis) return null;

  const teamIds = input.teamUserIds?.length ? new Set(input.teamUserIds) : null;
  const scopedMeetings = teamIds
    ? meetings.filter((m) => teamIds.has(m.sellerUserId))
    : meetings;
  const scopedMembers = teamIds
    ? teamList.members.filter((m) => teamIds.has(m.userId))
    : teamList.members;

  const activeCommercialsCount = new Set(scopedMeetings.map((m) => m.sellerUserId))
    .size;
  const scoreVals = scopedMeetings
    .map((m) => m.salesScore)
    .filter((s): s is number => s != null);
  const avgSalesScoreInWindow =
    scoreVals.length === 0
      ? null
      : Math.round(
          (scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) * 10,
        ) / 10;

  const monEquipe = buildMonEquipePage({
    members: scopedMembers,
    meetings: scopedMeetings,
    page: input.monEquipePage ?? 1,
  });

  const discPie = buildDiscPie(scopedMeetings);
  const soncasPie = buildSoncasPie(scopedMeetings);
  const kissTeamRollup = buildKissTeamRollupFromMeetings(scopedMeetings);

  return {
    statsWindowDays: input.statsWindowDays,
    home,
    kpis,
    avgSalesScoreInWindow,
    activeCommercialsCount,
    monEquipe,
    discPie,
    soncasPie,
    kissTeamRollup,
  };
}
