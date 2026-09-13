import { kissResultSchema } from "./kiss-result-zod";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

export type SalesProfileDimensionKey =
  | "assertivite"
  | "ecouteActive"
  | "capitalSympathie"
  | "argumentation"
  | "objections"
  | "nextSteps";

export type SalesProfileScores = Record<SalesProfileDimensionKey, number>;

export const SALES_PROFILE_DIMENSION_KEYS: readonly SalesProfileDimensionKey[] =
  [
    "assertivite",
    "ecouteActive",
    "capitalSympathie",
    "argumentation",
    "objections",
    "nextSteps",
  ] as const;

export type TeamSalesProfileAggregate = {
  scores: SalesProfileScores | null;
  /** RDV pris en compte, c'est-à-dire ceux dont l'analyse KISS note le vendeur. */
  rdvCount: number;
};

/**
 * Les six notes du commercial sur un RDV, ou null si personne ne l'a noté.
 *
 * Ce fichier ne lit plus ni SONCAS ni DISC, et il ne doit pas y revenir : ces
 * deux analyses décrivent le prospect, pas le commercial. Les moyenner ici
 * revenait à afficher les traits de l'acheteur sur un radar intitulé « Mon
 * profil de vente ». Un troisième calcul, disparu avec elles, comptait les
 * puces « start » de l'analyse KISS pour noter la dimension « Prochaines
 * étapes » : ces puces énumèrent ce que le commercial ne fait pas encore, si
 * bien que la note montait à mesure que le coach relevait des manques.
 *
 * `null` est une réponse. Un RDV analysé avant cette version porte une analyse
 * KISS valide sans les six notes ; il ne contribue à rien plutôt que de
 * contribuer des zéros, qui se liraient comme une évaluation nulle.
 */
export function salesProfileScoresFromMeeting(
  meeting: Pick<RecentMeetingListRow, "latestKissResult">,
): SalesProfileScores | null {
  const parsed = kissResultSchema.safeParse(meeting.latestKissResult);
  if (!parsed.success) return null;
  return parsed.data.sellerSkills ?? null;
}

/** Moyenne équipe (ou commercial) : chaque dimension moyennée sur les RDV notés. */
export function aggregateTeamSalesProfileFromMeetings(
  meetings: RecentMeetingListRow[],
): TeamSalesProfileAggregate {
  const perMeeting = meetings
    .map((m) => salesProfileScoresFromMeeting(m))
    .filter((s): s is SalesProfileScores => s != null);

  if (perMeeting.length === 0) {
    return { scores: null, rdvCount: 0 };
  }

  // Chaque RDV retenu porte les six dimensions, donc aucune moyenne ne se fait
  // sur un ensemble vide et aucune dimension ne retombe sur un zéro de
  // remplissage. Le seul « pas de données » possible est global, et il est déjà
  // sorti au-dessus sous la forme `scores: null`.
  const scores = {} as SalesProfileScores;
  for (const key of SALES_PROFILE_DIMENSION_KEYS) {
    scores[key] = Math.round(
      perMeeting.reduce((acc, s) => acc + s[key], 0) / perMeeting.length,
    );
  }

  return { scores, rdvCount: perMeeting.length };
}
