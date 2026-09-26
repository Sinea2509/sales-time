import {
  computeTeamDiscPie,
  computeTeamSoncasPie,
} from "@/src/core/domain/org-profile-distribution-pie";
import {
  DISC_HEX,
  DISC_LABEL_FR,
  SONCAS_HEX,
} from "@/src/core/domain/seller-affinity-from-meetings";
import {
  averageTamMinutes,
  prospectingMinutesForStatsWindow,
} from "@/src/core/domain/dashboard-tam-tuc";
import { tamMinutesSavedPerMeetingFromSettings } from "@/src/core/domain/dashboard-estimates";
import {
  dashboardHomeFromMeetings,
  type DashboardHomeFigures,
} from "@/src/core/domain/dashboard-home-from-meetings";
import {
  noteGlobaleOn5FromSalesScores,
  salesScoreAverage,
} from "@/src/core/domain/note-globale-on5";
import {
  formatNoteFr,
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
import {
  pipelineInProgress,
  type PipelineInProgress,
} from "@/src/core/domain/pipeline-in-progress";
import { salesScoreSeries } from "@/src/core/domain/sales-score-series";
import {
  parseScorecards,
  scorecardBlockAverages,
  scorecardCriterionShares,
  type ScorecardBlockAverage,
} from "@/src/core/domain/scorecard-team-axes";
import {
  teamWrittenSynthesis,
  type TeamWrittenSynthesis,
} from "@/src/core/domain/team-written-synthesis";
import type { RankingTier } from "@/src/core/domain/team-ranking";
import type { SoncasDriverAverages } from "@/src/core/domain/org-soncas-team-aggregate";
import type {
  MeetingRepositoryPort,
  RecentMeetingListRow,
} from "@/src/core/ports/meeting-repository-port";
import type { OrganizationSettingsRepositoryPort } from "@/src/core/ports/organization-settings-repository-port";
import type { OrganizationTeamRepositoryPort } from "@/src/core/ports/organization-team-repository-port";
import {
  meetingAtSinceForStatsWindow,
  previousMeetingAtWindowStart,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import { teamMemberMeetingsFingerprint } from "@/src/core/application/team-member-meetings-fingerprint";
import { plurielFr } from "@/lib/pluriel-fr";
import {
  scopeMeetingsToTeam,
  scopeMembersToTeam,
} from "@/lib/team-seller-scope";

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
  /**
   * La même moyenne sur 100, arrondie à l'entier.
   *
   * La note sur 5 est celle du manager, qui classe avec ; le commercial, lui,
   * lit son SalesScore sur 100, comme sur chacun de ses rendez-vous. Les deux
   * viennent des mêmes scores.
   */
  salesScoreAvg: number | null;
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

/**
 * Un membre classé, réduit à ce qu'il faut pour le poser sur l'axe des notes.
 *
 * Il porte son identité brute et non un libellé déjà écrit : c'est la vue qui
 * décide comment nommer quelqu'un, et elle le décide une seule fois, pour le
 * tableau comme pour la piste. Deux règles parallèles finiraient par afficher
 * « Camille Reynaud » d'un côté et son adresse de l'autre.
 */
export type OrgAdminTeamDispersionMember = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  /** Note globale du membre, sur 5. Toujours présente : un membre classé en a une. */
  noteOn5: number;
  rang: number;
};

/**
 * Ce que l'équipe dit d'elle-même, par-delà la ligne de chacun.
 *
 * Tout porte ici sur l'équipe entière, jamais sur la page affichée : une
 * dispersion tirée des dix premiers décrirait les dix premiers, sous un titre
 * qui annonce l'équipe.
 */
export type OrgAdminTeamCollective = {
  /**
   * Un point par membre classé, à poser sur l'axe des notes.
   *
   * Les membres hors classement en sont absents, comme ils sont absents de la
   * moyenne affichée juste au-dessus : les deux lectures doivent porter sur le
   * même groupe, sans quoi la moyenne ne tomberait pas au milieu de ses points.
   */
  dispersion: OrgAdminTeamDispersionMember[];
  /**
   * Les six compétences moyennes de l'équipe, un vote par commercial.
   *
   * C'est exactement la référence à laquelle chaque ligne est comparée dans la
   * colonne « Profil » : le relief de l'équipe et le profil de chacun se lisent
   * donc dans la même échelle, et un « +17 » individuel se rapporte bien à la
   * barre affichée au-dessus du tableau.
   */
  skillReference: SalesProfileScores | null;
  /** Commerciaux qui portent des notes de compétence : le dénominateur des barres. */
  skillSellers: number;
};

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
  collectif: OrgAdminTeamCollective;
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

/** Un commercial sur la barre des SalesScores moyens. */
export type OrgAdminScoreBar = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  salesScoreAvg: number;
  scoredMeetings: number;
};

/** Une marche du podium : les trois premiers du classement. */
export type OrgAdminPodiumStep = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  rank: number;
  noteOn5: number;
  tier: RankingTier | null;
};

/**
 * Ce que le tableau de bord du manager lit de son équipe au-delà des lignes :
 * les SalesScores par commercial, les blocs de la grille en retrait, la
 * synthèse écrite, le podium, le pipeline et la courbe d'équipe.
 */
export type OrgAdminTeamReading = {
  scoreBars: OrgAdminScoreBar[];
  blockAxes: ScorecardBlockAverage[];
  /** Scorecards lues pour les axes. */
  scorecards: number;
  synthesis: TeamWrittenSynthesis | null;
  podium: OrgAdminPodiumStep[];
  pipeline: PipelineInProgress;
  scoreSeries: number[];
  /** Commerciaux de l'équipe cadrée. */
  sellersCount: number;
};

export type OrgAdminDashboard = {
  statsWindowDays: StatsWindowDays;
  /**
   * Les chiffres de tête, sur la même population que le reste de la page.
   *
   * Les chiffres seuls, sans liste de derniers RDV : le tableau de bord du
   * manager n'en affiche pas, il affiche son équipe.
   */
  home: DashboardHomeFigures;
  monEquipe: OrgAdminMonEquipePage;
  discPie: OrgAdminDistributionPie;
  soncasPie: OrgAdminDistributionPie;
  kissTeamRollup: OrgAdminKissTeamRollup;
  teamReading: OrgAdminTeamReading;
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
  collectif: OrgAdminTeamCollective;
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
      salesScoreAvg: salesScoreAverage(s.salesScores),
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

  /*
    La lecture collective se prend sur `parRang`, c'est-à-dire sur l'équipe
    entière et déjà triée, avant tout découpage en pages. Une dispersion tirée
    de la page affichée décrirait les dix premiers sous un titre qui annonce
    l'équipe, et sa ligne de moyenne tomberait à côté de ses propres points.
  */
  const dispersion: OrgAdminTeamDispersionMember[] = parRang.flatMap((row) =>
    row.rank == null || row.noteGlobaleOn5 == null
      ? []
      : [
          {
            userId: row.userId,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            noteOn5: row.noteGlobaleOn5,
            rang: row.rank,
          },
        ],
  );

  return {
    rows: parRang,
    totalCount: rowsFull.length,
    collectif: {
      dispersion,
      skillReference: referenceEquipe,
      skillSellers: parMembre.filter((p) => p.skillScores != null).length,
    },
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
    collectif: equipe.collectif,
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
  /**
   * Moyenne des SalesScores sur 100 des seuls membres classés.
   *
   * Le pendant sur 100 de `ranking.averageNoteOn5`, pour l'écran du
   * commercial, qui se compare à son équipe sans passer par la note sur 5.
   * `null` quand personne n'est classé.
   */
  averageSalesScore: number | null;
};

export function buildTeamMemberStanding(input: {
  members: TeamMemberIdentity[];
  meetings: RecentMeetingListRow[];
  sellerUserId: string;
}): TeamMemberStanding {
  const equipe = buildRankedTeam(input);
  const scoresDesClasses = equipe.rows.flatMap((r) =>
    r.rank != null && r.salesScoreAvg != null ? [r.salesScoreAvg] : [],
  );
  return {
    row: equipe.rows.find((r) => r.userId === input.sellerUserId) ?? null,
    ranking: equipe.ranking,
    teamSize: equipe.totalCount,
    averageSalesScore: salesScoreAverage(scoresDesClasses),
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

  return buildTeamMemberStanding({
    members: scopeMembersToTeam(teamList.members, input.teamUserIds),
    meetings: scopeMeetingsToTeam(meetings, input.teamUserIds),
    sellerUserId: input.sellerUserId,
  });
}

/*
  Les couleurs et les mots des camemberts viennent du module des barres de la
  fiche : « Influent » y était ambre quand le camembert le peignait en bleu et
  l'appelait « I », et le lecteur devait recoller les deux tout seul. Les
  quatre lettres deviennent les quatre noms, et le même profil garde la même
  couleur d'une page à l'autre.
*/
const DISC_PIE_ORDER = ["D", "I", "S", "C"] as const;

const SONCAS_PIE_ORDER = [
  "securite",
  "orgueil",
  "nouveaute",
  "confort",
  "argent",
  "sympathie",
] as const;

function buildDiscPie(
  meetings: RecentMeetingListRow[],
): OrgAdminDistributionPie {
  const pie = computeTeamDiscPie(
    meetings.map((m) => m.latestDiscResult).filter((r) => r != null),
  );
  const slices: OrgAdminPieSlice[] = DISC_PIE_ORDER.map((key) => ({
    id: key,
    label: DISC_LABEL_FR[key],
    value: pie.values[key],
    color: DISC_HEX[key],
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
    color: SONCAS_HEX[key],
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

/**
 * Les phrases de progrès lues par le manager, sur son tableau de bord.
 *
 * Les deux tendances exprimées en points s'accordent par `plurielFr`, comme
 * partout ailleurs dans le produit, et non par un « (s) » écrit à la main :
 * c'était ici la dernière parenthèse de ce genre. Les deux valeurs arrivent
 * déjà arrondies au dixième par `dashboardHomeFromMeetings`, si bien que
 * l'accord porte bien sur le nombre écrit, jamais sur un nombre plus précis
 * que lui.
 *
 * Ce qui reste faux dans ces quatre phrases : les nombres y sont interpolés
 * bruts, si bien qu'un écart de TUC s'écrit « +2.5 » et non « +2,5 », et que
 * les deux pourcentages collent leur signe au chiffre, « 8% » et non « 8 % ».
 * Le SalesScore, lui, passe par `formatNoteFr` parce qu'il est bien une note
 * sur 5 ; les deux autres échelles n'ont pas leur formateur, et l'inventer ici
 * dépasserait ce que cette fonction corrige.
 */
export function buildOrgAdminProgressBullets(
  home: DashboardHomeFigures,
): string[] {
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
      `TUC optimisé : +${home.tucTrendPoints} ${plurielFr(home.tucTrendPoints, "point")} de pourcentage vs la période précédente.`,
    );
  }
  if (home.noteGlobaleTrendPoints != null && home.noteGlobaleTrendPoints > 0) {
    out.push(
      `SalesScore moyen : +${formatNoteFr(home.noteGlobaleTrendPoints)} ${plurielFr(home.noteGlobaleTrendPoints, "point")} sur 5 vs la période précédente.`,
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

/** Prénom, ou nom complet, ou adresse : ce par quoi on désigne un collègue. */
function shortNameOf(row: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const prenom = row.firstName?.trim();
  if (prenom) return prenom;
  const nom = row.lastName?.trim();
  return nom || row.email;
}

const ENGAGEMENT_BLOCK_KEY = "D";

/**
 * La lecture d'équipe du manager, depuis l'équipe classée et ses rendez-vous.
 *
 * Exportée pour ses tests : elle ne lit rien, elle compose. Les barres et le
 * podium reprennent les lignes du classement, si bien qu'un commercial ne
 * peut pas apparaître premier au podium et troisième sur les barres.
 */
export function buildOrgAdminTeamReading(input: {
  rows: readonly OrgAdminMonEquipeRankedRow[];
  meetings: readonly RecentMeetingListRow[];
}): OrgAdminTeamReading {
  const scoreBars: OrgAdminScoreBar[] = input.rows
    .flatMap((r) =>
      r.salesScoreAvg == null
        ? []
        : [
            {
              userId: r.userId,
              firstName: r.firstName,
              lastName: r.lastName,
              email: r.email,
              salesScoreAvg: r.salesScoreAvg,
              scoredMeetings: r.scoredMeetings,
            },
          ],
    )
    .sort((a, b) => b.salesScoreAvg - a.salesScoreAvg);

  const scorecards = parseScorecards(
    input.meetings.map((m) => m.latestScorecardResult),
  );
  const blockAxes = scorecardBlockAverages(scorecards);
  const criterionShares = scorecardCriterionShares(scorecards);

  const engagementBySeller = new Map<string, number | null>();
  for (const row of input.rows) {
    const own = parseScorecards(
      input.meetings
        .filter((m) => m.sellerUserId === row.userId)
        .map((m) => m.latestScorecardResult),
    );
    const block = scorecardBlockAverages(own).find(
      (b) => b.key === ENGAGEMENT_BLOCK_KEY,
    );
    engagementBySeller.set(row.userId, block?.avgPercent ?? null);
  }

  const synthesis = teamWrittenSynthesis({
    analyzedMeetings: input.meetings.filter((m) => m.salesScore != null).length,
    scorecards: scorecards.length,
    sellers: input.rows.map((r) => ({
      name:
        [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || r.email,
      shortName: shortNameOf(r),
      salesScore: r.salesScoreAvg,
      scoredMeetings: r.scoredMeetings,
      engagementPct: engagementBySeller.get(r.userId) ?? null,
    })),
    blockAverages: blockAxes,
    criterionShares,
    engagementBlockKey: ENGAGEMENT_BLOCK_KEY,
  });

  const podium: OrgAdminPodiumStep[] = input.rows
    .filter((r) => r.rank != null && r.rank <= 3 && r.noteGlobaleOn5 != null)
    .sort((a, b) => a.rank! - b.rank!)
    .map((r) => ({
      userId: r.userId,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      rank: r.rank!,
      noteOn5: r.noteGlobaleOn5!,
      tier: r.tier,
    }));

  return {
    scoreBars,
    blockAxes,
    scorecards: scorecards.length,
    synthesis,
    podium,
    pipeline: pipelineInProgress(input.meetings),
    scoreSeries: salesScoreSeries(input.meetings),
    sellersCount: input.rows.length,
  };
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
  const sincePrev = previousMeetingAtWindowStart(input.statsWindowDays);

  const [meetings, prevMeetings, teamList, orgSettings] = await Promise.all([
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: input.organizationId,
      limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
      meetingAtSince: sinceCurrent,
      includeLatestSoncasResult: true,
      includeLatestDiscResult: true,
      includeLatestKissResult: true,
      includeLatestScorecardResult: true,
    }),
    // La fenêtre précédente ne sert qu'aux variations, qui ne lisent que la
    // durée et le SalesScore : ses analyses détaillées ne sont pas demandées.
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: input.organizationId,
      limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
      meetingAtSince: sincePrev,
      meetingAtBefore: sinceCurrent,
    }),
    deps.organizationTeam.listMembersAndPendingInvitations(
      input.organizationId,
    ),
    deps.organizationSettings.findByOrganizationId(input.organizationId),
  ]);

  const scopedMeetings = scopeMeetingsToTeam(meetings, input.teamUserIds);
  const scopedPrevMeetings = scopeMeetingsToTeam(
    prevMeetings,
    input.teamUserIds,
  );
  const scopedMembers = scopeMembersToTeam(teamList.members, input.teamUserIds);

  /*
    Les chiffres de tête se comptent sur les mêmes rendez-vous que le tableau
    qui les suit. Ils venaient jusqu'ici du tableau de bord d'accueil, appelé
    sans périmètre : un manager de trois commerciaux lisait « 128 RDV » à
    l'échelle de l'organisation, puis, quatre centimètres plus bas, la liste
    nominative de ses trois commerciaux et leurs 19 RDV. Le premier chiffre
    n'était pas faux, il répondait à une autre question que celle que la page
    posait.
  */
  const home = dashboardHomeFromMeetings({
    statsWindowDays: input.statsWindowDays,
    tamMinutesPerRdv: tamMinutesSavedPerMeetingFromSettings(orgSettings),
    prospectingMinutes: prospectingMinutesForStatsWindow(
      orgSettings?.tamObjectiveMinutesPerMonth ?? 180,
      input.statsWindowDays,
    ),
    current: scopedMeetings,
    previous: scopedPrevMeetings,
  });

  const monEquipe = buildMonEquipePage({
    members: scopedMembers,
    meetings: scopedMeetings,
    page: input.monEquipePage ?? 1,
  });
  /*
    La lecture d'équipe se prend sur l'équipe entière classée, jamais sur la
    page affichée : un podium tiré des dix premiers d'une page 2 couronnerait
    le onzième.
  */
  const teamReading = buildOrgAdminTeamReading({
    rows: buildRankedTeam({ members: scopedMembers, meetings: scopedMeetings })
      .rows,
    meetings: scopedMeetings,
  });

  const discPie = buildDiscPie(scopedMeetings);
  const soncasPie = buildSoncasPie(scopedMeetings);
  const kissTeamRollup = buildKissTeamRollupFromMeetings(scopedMeetings);

  return {
    statsWindowDays: input.statsWindowDays,
    home,
    monEquipe,
    discPie,
    soncasPie,
    kissTeamRollup,
    teamReading,
    meetingsFingerprint: teamMemberMeetingsFingerprint(scopedMeetings),
  };
}
