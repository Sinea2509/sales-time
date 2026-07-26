import {
  computeTeamDiscPie,
  computeTeamSoncasPie,
} from "@/src/core/domain/org-profile-distribution-pie";
import { averageTamMinutes } from "@/src/core/domain/dashboard-tam-tuc";
import { noteGlobaleOn5FromSalesScores } from "@/src/core/domain/note-globale-on5";
import {
  rankTeamMembers,
  type MemberRanking,
  type TeamRankingSummary,
} from "@/src/core/domain/team-ranking";
import { kissResultSchema } from "@/src/core/domain/kiss-result-zod";
import {
  salesProfileScoresFromMeeting,
  type SalesProfileScores,
} from "@/src/core/domain/sales-profile-from-meetings";
import {
  averageSkillScores,
  sellerSkillSignature,
  type SellerSkillSignature,
} from "@/src/core/domain/seller-skill-signature";
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
import { teamMemberMeetingsFingerprint } from "@/src/core/application/team-member-meetings-fingerprint";

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
  /** TAM : temps d'appel moyen (min) sur les RDV connectés du membre. */
  tamMinutesAvg: number | null;
  /** Note globale moyenne sur 5 (SalesScore SONCAS converti). */
  noteGlobaleOn5: number | null;
  /** Nombre de RDV porteurs d'un SalesScore : le dénominateur de la note. */
  scoredMeetings: number;
  /**
   * Les six compétences du commercial, moyennées sur ses rendez-vous coachés.
   *
   * Ce sont des notes sur le vendeur, tirées de l'analyse KISS. La colonne
   * qu'elles remplacent affichait le levier SONCAS le plus fréquent chez ses
   * prospects : un portrait de son portefeuille, posé sur sa ligne à lui, sous
   * un intitulé qui se lisait comme un portrait de sa façon de vendre.
   *
   * `null` quand aucun de ses rendez-vous n'est noté sur ces six dimensions.
   */
  skillScores: SalesProfileScores | null;
  /** Nombre de RDV portant les six notes : le dénominateur de `skillScores`. */
  skillMeetings: number;
  /**
   * Sa compétence la plus au-dessus et la plus au-dessous de son équipe.
   *
   * `null` quand il n'y a rien à comparer : aucun rendez-vous noté de son côté,
   * ou personne d'autre de noté à qui se mesurer.
   */
  skillSignature: SellerSkillSignature | null;
};

/** Ligne d'équipe enrichie de son rang, de son palier et de son écart à la moyenne. */
export type OrgAdminMonEquipeRankedRow = OrgAdminMonEquipeRow & MemberRanking;

export type OrgAdminMonEquipePage = {
  page: number;
  pageSize: number;
  totalCount: number;
  rows: OrgAdminMonEquipeRankedRow[];
  /**
   * Classement calculé sur l'équipe entière, jamais sur la page seule : sinon le
   * premier de la deuxième page s'afficherait premier.
   */
  ranking: TeamRankingSummary;
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
  /** Fingerprint of scoped meetings in the stats window (AI summary cache key). */
  meetingsFingerprint: string;
};

const DRIVER_LABEL_FR: Record<keyof SoncasDriverAverages, string> = {
  securite: "Sécurité",
  orgueil: "Orgueil",
  nouveaute: "Nouveauté",
  confort: "Confort",
  argent: "Argent",
  sympathie: "Sympathie",
};

type SellerWindowStats = {
  nbRdvs: number;
  coachesCount: number;
  /** Les six notes du vendeur, un jeu par rendez-vous qui en porte. */
  skillNotes: SalesProfileScores[];
  connectedDurations: number[];
  salesScores: number[];
};

const AUCUN_RDV: SellerWindowStats = {
  nbRdvs: 0,
  coachesCount: 0,
  skillNotes: [],
  connectedDurations: [],
  salesScores: [],
};

function aggregateSellerWindowStats(
  meetings: RecentMeetingListRow[],
): Map<string, SellerWindowStats> {
  const map = new Map<string, SellerWindowStats>();
  for (const row of meetings) {
    const cur = map.get(row.sellerUserId) ?? {
      nbRdvs: 0,
      coachesCount: 0,
      skillNotes: [] as SalesProfileScores[],
      connectedDurations: [] as number[],
      salesScores: [] as number[],
    };
    cur.nbRdvs += 1;
    if (row.hasKiss) cur.coachesCount += 1;
    if (row.salesScore != null) cur.salesScores.push(row.salesScore);
    if (row.durationMin != null && row.durationMin > 0) {
      cur.connectedDurations.push(row.durationMin);
    }
    const skills = salesProfileScoresFromMeeting(row);
    if (skills != null) cur.skillNotes.push(skills);
    map.set(row.sellerUserId, cur);
  }
  return map;
}

export type TeamMemberIdentity = {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

/** Nom d'affichage replié pour le tri, avec l'adresse pour seul recours. */
function cleDeNom(row: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  return (
    `${row.lastName ?? ""} ${row.firstName ?? ""}`
      .trim()
      .toLocaleLowerCase("fr") || row.email.toLocaleLowerCase("fr")
  );
}

/**
 * L'équipe entière, classée, dans l'ordre d'affichage du tableau.
 *
 * Cette fonction est le seul endroit où le classement est calculé. La liste
 * paginée et la fiche d'un commercial s'en servent toutes les deux : une place
 * annoncée « 3e » dans le tableau doit rester « 3e » quand on ouvre la fiche,
 * et deux calculs parallèles finiraient toujours par diverger.
 */
export function buildRankedTeam(input: {
  members: TeamMemberIdentity[];
  meetings: RecentMeetingListRow[];
}): {
  rows: OrgAdminMonEquipeRankedRow[];
  ranking: TeamRankingSummary;
  totalCount: number;
} {
  const bySeller = aggregateSellerWindowStats(input.meetings);

  /*
    La moyenne d'un commercial se fait sur ses rendez-vous : chacun de ses
    rendez-vous notés pèse pareil chez lui.
  */
  const parMembre = input.members.map((mem) => {
    const s = bySeller.get(mem.userId) ?? AUCUN_RDV;
    return { mem, s, skillScores: averageSkillScores(s.skillNotes) };
  });

  /*
    La référence, elle, se fait sur les commerciaux : un élément par personne,
    pas un par rendez-vous. Autrement, celui qui tient le plus gros volume
    fixerait à lui seul la barre à laquelle on le compare ensuite, et un
    commercial constant se verrait « au-dessus de l'équipe » le mois où un
    collègue en difficulté a beaucoup travaillé.
  */
  const referenceEquipe = averageSkillScores(
    parMembre.map((p) => p.skillScores),
  );

  const rowsFull: OrgAdminMonEquipeRow[] = parMembre.map(
    ({ mem, s, skillScores }) => ({
      userId: mem.userId,
      membershipId: mem.membershipId,
      firstName: mem.firstName,
      lastName: mem.lastName,
      email: mem.email,
      nbRdvs: s.nbRdvs,
      coachesCount: s.coachesCount,
      tamMinutesAvg: averageTamMinutes(s.connectedDurations),
      noteGlobaleOn5: noteGlobaleOn5FromSalesScores(s.salesScores),
      scoredMeetings: s.salesScores.length,
      skillScores,
      skillMeetings: s.skillNotes.length,
      skillSignature: sellerSkillSignature(skillScores, referenceEquipe),
    }),
  );

  // Le classement porte sur l'équipe entière et se calcule avant tout découpage
  // en pages : un rang relatif à une page serait faux dès la deuxième.
  const classement = rankTeamMembers(rowsFull);

  /*
    L'ordre d'affichage est le classement lui-même.

    La première colonne du tableau s'appelle « Rang ». Rangées par volume, ses
    valeurs descendaient 3, 1, 2, 3, 5, et sur une équipe de plus de dix la
    première page pouvait ne pas contenir le premier : la colonne annonçait un
    classement que la liste ne suivait pas.

    Les membres classés viennent donc par rang croissant. À rang égal passe
    d'abord celui qui a le plus de rendez-vous : même note, plus de matière
    derrière. Les membres hors classement ferment la liste, ceux qui ont déjà un
    score avant ceux qui n'en ont aucun : les premiers n'attendent que du
    volume, les seconds n'ont encore rien à coacher.
  */
  const rangDeSortie = (row: (typeof classement.rows)[number]): number => {
    if (row.rank != null) return row.rank;
    return row.unrankedReason === "volume-insuffisant"
      ? Number.MAX_SAFE_INTEGER - 1
      : Number.MAX_SAFE_INTEGER;
  };
  const parRang = [...classement.rows].sort((a, b) => {
    const ra = rangDeSortie(a);
    const rb = rangDeSortie(b);
    if (ra !== rb) return ra - rb;
    if (b.nbRdvs !== a.nbRdvs) return b.nbRdvs - a.nbRdvs;
    return cleDeNom(a).localeCompare(cleDeNom(b), "fr");
  });

  return {
    rows: parRang,
    totalCount: rowsFull.length,
    ranking: {
      rankedCount: classement.rankedCount,
      unrankedCount: classement.unrankedCount,
      unrankedNoScoreCount: classement.unrankedNoScoreCount,
      unrankedLowVolumeCount: classement.unrankedLowVolumeCount,
      averageNoteOn5: classement.averageNoteOn5,
      minScoredMeetings: classement.minScoredMeetings,
    },
  };
}

export function buildMonEquipePage(input: {
  members: TeamMemberIdentity[];
  meetings: RecentMeetingListRow[];
  page: number;
}): OrgAdminMonEquipePage {
  const equipe = buildRankedTeam(input);
  const lastPage = Math.max(
    1,
    Math.ceil(equipe.totalCount / ORG_ADMIN_MON_EQUIPE_PAGE_SIZE),
  );
  const page = Math.min(lastPage, Math.max(1, input.page));
  const start = (page - 1) * ORG_ADMIN_MON_EQUIPE_PAGE_SIZE;

  return {
    page,
    pageSize: ORG_ADMIN_MON_EQUIPE_PAGE_SIZE,
    totalCount: equipe.totalCount,
    rows: equipe.rows.slice(start, start + ORG_ADMIN_MON_EQUIPE_PAGE_SIZE),
    ranking: equipe.ranking,
  };
}

/**
 * Position d'un membre dans son équipe, telle qu'elle doit être rappelée sur sa
 * fiche.
 *
 * `row` vaut `null` quand la personne demandée n'appartient pas à l'équipe
 * cadrée : la fiche affiche alors ses statistiques sans prétendre à un rang,
 * plutôt qu'un rang calculé sur un groupe auquel elle n'appartient pas.
 */
export type TeamMemberStanding = {
  row: OrgAdminMonEquipeRankedRow | null;
  ranking: TeamRankingSummary;
  /** Effectif de l'équipe sur laquelle ce rang est calculé. */
  teamSize: number;
};

export function buildTeamMemberStanding(input: {
  members: TeamMemberIdentity[];
  meetings: RecentMeetingListRow[];
  sellerUserId: string;
}): TeamMemberStanding {
  const equipe = buildRankedTeam(input);
  return {
    row: equipe.rows.find((r) => r.userId === input.sellerUserId) ?? null,
    ranking: equipe.ranking,
    teamSize: equipe.totalCount,
  };
}

/**
 * Charge l'équipe cadrée et en tire la place d'un commercial.
 *
 * La fiche d'un commercial ne charge que ses propres rendez-vous : elle ne peut
 * donc pas déduire seule un rang, qui est par nature relatif aux autres. Cette
 * fonction refait la lecture d'équipe du tableau « Mon équipe », avec le même
 * cadrage manager et la même fenêtre, pour que les deux écrans annoncent le même
 * chiffre. Elle demande les résultats SONCAS, porteurs du SalesScore sur lequel
 * repose le classement, et les résultats KISS, porteurs des six notes du
 * vendeur : le profil affiché sur la fiche se compare à la même équipe que
 * celui du tableau, et les deux écrans ne peuvent donc pas nommer deux points
 * forts différents pour la même personne.
 *
 * Renvoie `null` quand le rang n'a pas de sens : hors organisation, ou lorsque
 * le manager ne cadre aucune équipe.
 */
export async function getTeamMemberStanding(
  deps: {
    meetings: MeetingRepositoryPort;
    organizationTeam: OrganizationTeamRepositoryPort;
  },
  input: {
    organizationId: string | null;
    statsWindowDays: StatsWindowDays;
    sellerUserId: string;
    /** Cadrage manager : quand il est fourni, le rang porte sur ce sous-ensemble. */
    teamUserIds?: string[];
  },
): Promise<TeamMemberStanding | null> {
  if (!input.organizationId) return null;

  const [teamList, meetings] = await Promise.all([
    deps.organizationTeam.listMembersAndPendingInvitations(
      input.organizationId,
    ),
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: input.organizationId,
      limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
      meetingAtSince: meetingAtSinceForStatsWindow(input.statsWindowDays),
      includeLatestSoncasResult: true,
      includeLatestKissResult: true,
    }),
  ]);

  const teamIds = input.teamUserIds?.length ? new Set(input.teamUserIds) : null;

  return buildTeamMemberStanding({
    members: teamIds
      ? teamList.members.filter((m) => teamIds.has(m.userId))
      : teamList.members,
    meetings: teamIds
      ? meetings.filter((m) => teamIds.has(m.sellerUserId))
      : meetings,
    sellerUserId: input.sellerUserId,
  });
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
  if (home.tamCumuleTrendPercent != null && home.tamCumuleTrendPercent > 0) {
    out.push(
      `TAM en hausse de ${home.tamCumuleTrendPercent}% sur la période vs la fenêtre précédente.`,
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
      `SalesScore moyen : +${home.noteGlobaleTrendPoints} point(s) sur 5 vs la période précédente.`,
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
      "Les leviers SONCAS sont équilibrés sur la période : maintenez la régularité d’analyse.",
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

  const activeCommercialsCount = new Set(
    scopedMeetings.map((m) => m.sellerUserId),
  ).size;
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
    meetingsFingerprint: teamMemberMeetingsFingerprint(scopedMeetings),
  };
}
