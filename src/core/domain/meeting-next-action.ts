import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";

/**
 * Ce qu'il reste à faire sur un rendez-vous, en un mot, pour son commercial.
 *
 * La liste des rendez-vous montrait ce qui s'était passé, jamais ce qu'il
 * restait à faire : le commercial devait ouvrir chaque ligne pour savoir
 * laquelle attendait quelque chose de lui. Cette fonction lit l'état réel d'un
 * rendez-vous et le résume en une action, pour que la liste se pilote d'un coup
 * d'œil.
 *
 * L'ordre des tests suit celui de la vie d'un rendez-vous. D'abord le pipeline
 * d'analyse, parce qu'un rendez-vous en cours d'analyse n'appelle rien d'autre
 * que d'attendre, et qu'une analyse échouée se relance avant toute lecture.
 * Ensuite le coaching : sans analyse, la seule action est de la lancer. Puis
 * l'issue commerciale : gagné et perdu sont des fins, un rendez-vous à suivre
 * appelle une relance, prête ou à écrire selon qu'un brouillon existe déjà.
 */

export type MeetingActionTone = "todo" | "waiting" | "won" | "lost" | "neutral";

/** Ce qui range une action dans le résumé « à faire ». `null` = rien à faire. */
export type MeetingActionCategory = "analyse" | "relance" | null;

export type MeetingNextAction = {
  readonly label: string;
  readonly tone: MeetingActionTone;
  readonly category: MeetingActionCategory;
};

export type MeetingActionInput = {
  status: MeetingStatus;
  outcome: MeetingOutcome;
  /** Vrai dès qu'une analyse KISS existe : le rendez-vous porte du coaching. */
  hasKiss: boolean;
  /** Présent dès qu'une analyse SONCAS a produit un score. */
  salesScore: number | null;
  /** Brouillon d'e-mail de relance, quand il a déjà été rédigé. */
  followUpEmailDraft: string | null;
};

export function meetingNextAction(
  meeting: MeetingActionInput,
): MeetingNextAction {
  if (meeting.status === "PENDING" || meeting.status === "PROCESSING") {
    return { label: "Analyse en cours", tone: "waiting", category: null };
  }
  if (meeting.status === "FAILED") {
    return { label: "Analyse à relancer", tone: "todo", category: "analyse" };
  }

  const analyse = meeting.hasKiss || meeting.salesScore != null;
  if (!analyse) {
    return { label: "À analyser", tone: "todo", category: "analyse" };
  }

  if (meeting.outcome === "WON") {
    return { label: "Gagné", tone: "won", category: null };
  }
  if (meeting.outcome === "LOST") {
    return { label: "Perdu", tone: "lost", category: null };
  }
  if (meeting.outcome === "FOLLOW_UP") {
    return meeting.followUpEmailDraft
      ? { label: "Relance prête", tone: "neutral", category: null }
      : { label: "À relancer", tone: "todo", category: "relance" };
  }

  return { label: "Analysé", tone: "neutral", category: null };
}

export type MeetingsTodoSummary = {
  /** Rendez-vous en attente d'une analyse (jamais analysés, ou analyse échouée). */
  readonly aAnalyser: number;
  /** Rendez-vous analysés, issue « à suivre », dont la relance reste à écrire. */
  readonly aRelancer: number;
};

/**
 * Ce que le commercial a à faire sur sa liste, compté par nature.
 *
 * Deux nombres seulement, ceux qui appellent un geste de sa part cette semaine :
 * les rendez-vous à analyser et ceux à relancer. Un rendez-vous gagné, perdu ou
 * en cours d'analyse n'y entre pas, il n'attend rien de lui.
 */
export function meetingsTodoSummary(
  meetings: readonly MeetingActionInput[],
): MeetingsTodoSummary {
  let aAnalyser = 0;
  let aRelancer = 0;
  for (const meeting of meetings) {
    const category = meetingNextAction(meeting).category;
    if (category === "analyse") aAnalyser += 1;
    else if (category === "relance") aRelancer += 1;
  }
  return { aAnalyser, aRelancer };
}

/**
 * Les rendez-vous qui appellent un geste d'une nature donnée.
 *
 * Le résumé « à faire » compte, il ne montre pas : sur deux cents lignes
 * réparties en pages de dix, savoir qu'il en reste sept à analyser n'apprend
 * pas lesquelles, et les chercher page à page est le travail que ce résumé
 * prétendait épargner. Ce filtre est la moitié qui manquait, celle qui réduit
 * la liste à ce qu'un nombre vient d'annoncer.
 *
 * `null` ne retient rien plutôt que de tout rejeter : c'est l'état de repos
 * d'un filtre, la liste entière.
 */
export function filterMeetingsByTodoCategory<T extends MeetingActionInput>(
  meetings: readonly T[],
  category: MeetingActionCategory,
): T[] {
  if (category == null) return [...meetings];
  return meetings.filter((m) => meetingNextAction(m).category === category);
}
