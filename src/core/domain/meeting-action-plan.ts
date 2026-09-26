import type { KissAnalysisResult } from "./kiss-result-zod";
import {
  DEFAULT_SCORECARD_GRID,
  scorecardCriteria,
  scorecardGridById,
} from "./scorecard-grid";
import type { ScorecardAnalysisResult } from "./scorecard-result-zod";

/**
 * Une action du plan d'un rendez-vous : ce qu'il faut faire, quand, et qui.
 *
 * Le critère est là quand l'action vient de la scorecard : c'est le point de
 * la grille que le prochain échange doit couvrir. Il manque quand l'action
 * vient du coaching, qui parle de gestes et non de critères.
 */
export type MeetingActionItem = {
  criterionKey: string | null;
  criterionLabel: string | null;
  title: string;
  /** La phrase à dire, quand la scorecard l'a écrite. */
  hint: string | null;
  when: string;
  who: string;
};

export const MEETING_ACTION_PLAN_MAX = 4;
const FROM_SCORECARD_MAX = 3;

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
});

/** Nettoie une puce collée par le coaching, quel que soit le tiret choisi. */
function cleanBullet(text: string): string {
  return text.replace(/^[\s\-–—•·]+\s*/, "").trim();
}

/**
 * Le plan d'action d'un rendez-vous, comme la maquette du 11 septembre le
 * pose dans la colonne de droite : chaque action porte une échéance et un
 * responsable.
 *
 * Les premières viennent des points perdus de la scorecard, les plus
 * coûteux d'abord : « Couvrir le budget », avec la phrase que le commercial
 * aurait dû dire. Les suivantes viennent du coaching KISS, ce qu'il faut
 * commencer, puis ce qu'il faut affiner. L'échéance est le prochain
 * rendez-vous quand sa date est connue, « au prochain échange » sinon.
 */
export function meetingActionPlan(input: {
  scorecard: ScorecardAnalysisResult | null;
  kiss: KissAnalysisResult | null;
  /** Le commercial du rendez-vous, tel qu'on le nomme ; « Vous » à défaut. */
  sellerName: string | null;
  nextMeetingAt?: Date | null;
  max?: number;
}): MeetingActionItem[] {
  const max = input.max ?? MEETING_ACTION_PLAN_MAX;
  const who = input.sellerName?.trim() || "Vous";
  const when = input.nextMeetingAt
    ? `Le ${dateShort.format(input.nextMeetingAt)}`
    : "Au prochain échange";
  const items: MeetingActionItem[] = [];

  if (input.scorecard) {
    const grid =
      scorecardGridById(input.scorecard.gridId) ?? DEFAULT_SCORECARD_GRID;
    const labels = new Map(
      scorecardCriteria(grid).map((c) => [c.key.toUpperCase(), c.label]),
    );
    const seen = new Set<string>();
    for (const lost of input.scorecard.pointsLost) {
      const key = lost.key.trim().toUpperCase();
      const label = labels.get(key);
      if (!label || seen.has(key)) continue;
      seen.add(key);
      items.push({
        criterionKey: key,
        criterionLabel: label,
        title: `Couvrir ${label.toLowerCase()}`,
        hint: lost.whatToSayInstead.trim() || null,
        when,
        who,
      });
      if (items.length >= FROM_SCORECARD_MAX) break;
    }
  }

  if (input.kiss) {
    for (const raw of [...input.kiss.start, ...input.kiss.improve]) {
      if (items.length >= max) break;
      const text = cleanBullet(raw);
      if (!text) continue;
      items.push({
        criterionKey: null,
        criterionLabel: null,
        title: text,
        hint: null,
        when: "Cette semaine",
        who,
      });
    }
  }

  return items.slice(0, max);
}
