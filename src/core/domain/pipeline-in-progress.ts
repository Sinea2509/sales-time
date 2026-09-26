import type { MeetingOutcome } from "./meeting-outcome";

export type PipelineMeeting = {
  personId: string;
  outcome: MeetingOutcome;
  potentialAmount: number | null;
  meetingAt: Date;
};

export type PipelineInProgress = {
  /** Somme des potentiels des affaires encore ouvertes, en euros. */
  totalEuro: number;
  /** Affaires ouvertes : un contact dont le dernier rendez-vous n'est ni gagné ni perdu. */
  activeDeals: number;
  /** Parmi elles, celles dont un potentiel est renseigné. */
  valuedDeals: number;
};

/** Une affaire se ferme quand son dernier rendez-vous l'a tranchée. */
const CLOSED: ReadonlySet<MeetingOutcome> = new Set(["WON", "LOST"]);

/** Une date absente d'un jeu d'essai vaut le plus ancien, jamais une erreur. */
const timeOf = (d: Date | undefined): number =>
  d instanceof Date ? d.getTime() : 0;

/**
 * Le potentiel en cours : ce que valent les affaires encore ouvertes.
 *
 * Une affaire, c'est un contact, pas un rendez-vous : trois rendez-vous avec
 * la même personne ne font pas trois affaires, et additionner leurs trois
 * potentiels triplerait le pipeline. Chaque contact ne compte qu'une fois,
 * par son dernier rendez-vous, qui dit si l'affaire est encore ouverte et ce
 * qu'elle vaut aujourd'hui.
 */
export function pipelineInProgress(
  meetings: readonly PipelineMeeting[],
): PipelineInProgress {
  const latest = new Map<string, PipelineMeeting>();
  for (const m of meetings) {
    const cur = latest.get(m.personId);
    if (!cur || timeOf(m.meetingAt) > timeOf(cur.meetingAt)) {
      latest.set(m.personId, m);
    }
  }

  let totalEuro = 0;
  let activeDeals = 0;
  let valuedDeals = 0;
  for (const m of latest.values()) {
    if (CLOSED.has(m.outcome)) continue;
    activeDeals += 1;
    if (m.potentialAmount != null && m.potentialAmount > 0) {
      valuedDeals += 1;
      totalEuro += m.potentialAmount;
    }
  }
  return { totalEuro: Math.round(totalEuro), activeDeals, valuedDeals };
}
