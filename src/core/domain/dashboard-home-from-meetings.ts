import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";
import type { StatsWindowDays } from "./dashboard-stats-window";
import {
  averageTamMinutes,
  countConnectedMeetings,
  sumUsefulConversationMinutes,
  tucOptimisePercent,
} from "./dashboard-tam-tuc";
import { percentChangeVsPrevious } from "./dashboard-trend";
import { noteGlobaleOn5FromSalesScores } from "./note-globale-on5";

/**
 * Tout ce que ce calcul lit d'un rendez-vous : sa durée et son SalesScore.
 *
 * La signature le dit plutôt que de prendre la ligne entière, pour qu'un jeu
 * d'essai n'ait pas à fabriquer les vingt autres colonnes d'un
 * `RecentMeetingListRow` avant de vérifier une moyenne.
 */
export type DashboardHomeMeeting = Pick<
  RecentMeetingListRow,
  "durationMin" | "salesScore"
>;

/** Les chiffres de tête d'un tableau de bord, hors liste des derniers RDV. */
export type DashboardHomeFigures = {
  statsWindowDays: StatsWindowDays;
  /**
   * TAM par RDV (minutes) : temps administratif économisé sur un rendez-vous,
   * d'après les paramètres de l'organisation (CR + CRM + e-mail − résiduel).
   */
  tamMinutesPerRdv: number;
  /** Temps d'appel moyen (min) sur les RDV connectés (durée renseignée). */
  avgDurationMin: number | null;
  /** Somme des durées de conversation utile (RDV connectés) sur la fenêtre. */
  usefulConversationMinutes: number;
  /** Temps de prospection de référence sur la fenêtre (objectif org proratisé). */
  prospectingMinutes: number;
  /**
   * TAM cumulé (minutes) : le gain par RDV multiplié par le nombre de RDV
   * renseignés sur la fenêtre. C'est bien du temps administratif économisé, et
   * non du temps de conversation, que ce champ porte.
   */
  tamCumuleMinutes: number;
  /** RDV avec durée renseignée (> 0 min) sur la fenêtre. */
  nbRdvsRenseignes: number;
  nbRdvs: number;
  /** TUC optimisé = conversation utile / temps de prospection (objectif org proratisé). */
  tucOptimisePercent: number | null;
  /** Variation du temps d'appel moyen vs fenêtre précédente (%). */
  tamTrendPercent: number | null;
  /** Variation TAM cumulé vs fenêtre précédente (%). */
  tamCumuleTrendPercent: number | null;
  nbRdvsTrendPercent: number | null;
  nbRdvsRenseignesTrendPercent: number | null;
  /** Écart en points de pourcentage du TUC vs période précédente. */
  tucTrendPoints: number | null;
  avgDurationTrendPercent: number | null;
  /** Note globale /5 (moyenne SalesScore /100 ÷ 20, arrondi 0.1), null si aucune analyse. */
  noteGlobaleOn5: number | null;
  noteGlobaleTrendPoints: number | null;
  /** Variation % de la note globale vs période précédente. */
  noteGlobaleTrendPercent: number | null;
  /** RDV avec SalesScore (SONCAS) sur la fenêtre, base du gating de la tendance de note globale. */
  noteGlobaleSampleCount: number;
};

function noteGlobaleOn5ForMeetings(
  meetings: DashboardHomeMeeting[],
): number | null {
  const scores = meetings
    .map((m) => m.salesScore)
    .filter((s): s is number => s != null);
  return noteGlobaleOn5FromSalesScores(scores);
}

/**
 * Les chiffres de tête, calculés depuis les rendez-vous de deux fenêtres : la
 * courante et celle qui la précède.
 *
 * Aucune requête ici, et c'est le but. Le même calcul sert deux populations :
 * un commercial lit ses propres rendez-vous, un manager ceux de son équipe.
 * Tant que ce calcul restait soudé à ses requêtes, la seconde population ne
 * pouvait pas exister sans réécrire l'arithmétique, donc sans risquer de la
 * réécrire autrement.
 *
 * Les deux listes arrivent déjà cadrées sur leur fenêtre et sur leur
 * population : cette fonction ne filtre rien, elle compte.
 */
export function dashboardHomeFromMeetings(input: {
  statsWindowDays: StatsWindowDays;
  /** Gain administratif par RDV, tiré des paramètres de l'organisation. */
  tamMinutesPerRdv: number;
  /** Temps de prospection de référence sur la fenêtre. */
  prospectingMinutes: number;
  /** RDV de la fenêtre courante. */
  current: DashboardHomeMeeting[];
  /** RDV de la fenêtre précédente, de même durée. */
  previous: DashboardHomeMeeting[];
}): DashboardHomeFigures {
  const currentDurations = input.current.map((m) => m.durationMin);
  const prevDurations = input.previous.map((m) => m.durationMin);

  const nbRdvs = input.current.length;
  const nbRdvsPrev = input.previous.length;

  const usefulConversationMinutes =
    sumUsefulConversationMinutes(currentDurations);
  const usefulConversationPrev = sumUsefulConversationMinutes(prevDurations);
  const nbRdvsRenseignes = countConnectedMeetings(currentDurations);
  const nbRdvsRenseignesPrev = countConnectedMeetings(prevDurations);

  const tucOptimisePercentValue = tucOptimisePercent(
    usefulConversationMinutes,
    input.prospectingMinutes,
  );
  const tucPrevPercent = tucOptimisePercent(
    usefulConversationPrev,
    input.prospectingMinutes,
  );

  const avgDurationMin = averageTamMinutes(currentDurations);
  const avgDurationPrev = averageTamMinutes(prevDurations);

  const noteGlobaleOn5 = noteGlobaleOn5ForMeetings(input.current);
  const noteGlobalePrevOn5 = noteGlobaleOn5ForMeetings(input.previous);
  const noteGlobaleSampleCount = input.current.filter(
    (m) => m.salesScore != null,
  ).length;

  const nbRdvsTrendPercent = percentChangeVsPrevious(nbRdvs, nbRdvsPrev);
  const nbRdvsRenseignesTrendPercent = percentChangeVsPrevious(
    nbRdvsRenseignes,
    nbRdvsRenseignesPrev,
  );

  // Le TAM cumulé, c'est le gain administratif par RDV répété sur les RDV
  // renseignés de la fenêtre. Il portait jusqu'ici la somme des durées de
  // conversation, c'est-à-dire l'exact contraire de ce que son libellé promet :
  // le temps passé à parler, présenté comme du temps économisé. Un prospect à
  // qui l'on démontre le produit lisait donc « vous avez gagné 31 h » devant un
  // nombre qui mesurait ses heures d'appel.
  //
  // Le gain par RDV est constant sur les deux fenêtres, si bien que la variation
  // du cumul est celle du nombre de RDV renseignés. Elle est calculée
  // explicitement plutôt que déduite, pour que la lecture ne dépende pas de ce
  // rapprochement.
  const tamCumuleMinutes = input.tamMinutesPerRdv * nbRdvsRenseignes;
  const tamCumuleTrendPercent = percentChangeVsPrevious(
    tamCumuleMinutes,
    input.tamMinutesPerRdv * nbRdvsRenseignesPrev,
  );

  const tamTrendPercent =
    avgDurationMin != null
      ? percentChangeVsPrevious(avgDurationMin, avgDurationPrev ?? 0)
      : null;

  const tucTrendPoints =
    tucOptimisePercentValue != null && tucPrevPercent != null
      ? Math.round((tucOptimisePercentValue - tucPrevPercent) * 10) / 10
      : null;

  const noteGlobaleTrendPoints =
    noteGlobaleOn5 != null && noteGlobalePrevOn5 != null
      ? Math.round((noteGlobaleOn5 - noteGlobalePrevOn5) * 10) / 10
      : null;

  const noteGlobaleTrendPercent =
    noteGlobaleOn5 != null
      ? percentChangeVsPrevious(noteGlobaleOn5, noteGlobalePrevOn5 ?? 0)
      : null;

  return {
    statsWindowDays: input.statsWindowDays,
    tamMinutesPerRdv: input.tamMinutesPerRdv,
    avgDurationMin,
    usefulConversationMinutes,
    prospectingMinutes: input.prospectingMinutes,
    tamCumuleMinutes,
    nbRdvsRenseignes,
    nbRdvs,
    tucOptimisePercent: tucOptimisePercentValue,
    tamTrendPercent,
    tamCumuleTrendPercent,
    nbRdvsTrendPercent,
    nbRdvsRenseignesTrendPercent,
    tucTrendPoints,
    avgDurationTrendPercent: tamTrendPercent,
    noteGlobaleOn5,
    noteGlobaleTrendPoints,
    noteGlobaleTrendPercent,
    noteGlobaleSampleCount,
  };
}
