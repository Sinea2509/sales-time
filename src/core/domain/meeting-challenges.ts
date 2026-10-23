import { z } from "zod";

/**
 * Les défis du prochain rendez-vous, à la place des quatre listes KISS sur la
 * fiche du commercial.
 *
 * Demande de Thomas du 23 octobre 2026 : « à la place du KISS, je veux des
 * petits challenges avec une info à obtenir ou quelque chose à dire au
 * prochain rendez-vous ». Trois défis courts, concrets, qu'on peut relire en
 * dix secondes avant d'entrer en rendez-vous.
 */
export const MEETING_CHALLENGE_KINDS = ["info", "phrase", "geste"] as const;

export type MeetingChallengeKind = (typeof MEETING_CHALLENGE_KINDS)[number];

export const meetingChallengeSchema = z.object({
  kind: z
    .enum(MEETING_CHALLENGE_KINDS)
    .describe(
      "info : une information à obtenir du prospect ; phrase : une phrase à dire ; geste : une façon de faire.",
    ),
  title: z
    .string()
    .min(1)
    .max(90)
    .describe(
      "Le défi en quelques mots, qui commence par un verbe : « Obtenir le budget formation ».",
    ),
  detail: z
    .string()
    .min(1)
    .max(300)
    .describe(
      "Pour info et phrase : les mots exacts à dire, entre guillemets, tels que le commercial les prononcerait. Pour geste : ce qu'il fait, concrètement, et à quel moment.",
    ),
  why: z
    .string()
    .max(200)
    .describe(
      "Pourquoi ce défi compte pour la suite de l'affaire, en une phrase.",
    ),
});

export type MeetingChallenge = z.infer<typeof meetingChallengeSchema>;

/** Les trois défis du prochain rendez-vous, un de chaque sorte. */
export const meetingChallengesSchema = z
  .array(meetingChallengeSchema)
  .min(1)
  .max(3);

const ORDER: Record<MeetingChallengeKind, number> = {
  info: 0,
  phrase: 1,
  geste: 2,
};

/** Ce que la fiche lit du coaching pour en tirer des défis. */
export type ChallengeSource = {
  challenges?: MeetingChallenge[] | null;
  goldenQuestion?: string | null;
  challenge?: string | null;
  start?: readonly string[] | null;
};

function sansGuillemets(text: string): string {
  return text.trim().replace(/^[«"“\s]+|[»"”\s]+$/gu, "");
}

/**
 * Les défis à afficher : ceux que le coaching a écrits, sinon, pour un
 * rendez-vous analysé avant leur arrivée, ceux qu'on peut tirer de ce qu'il
 * avait déjà écrit (la question en or, le défi, le premier « à démarrer »).
 * Toutes les fiches montrent ainsi des défis dès la mise en ligne, sans
 * relancer d'analyse.
 */
export function challengesForDisplay(
  source: ChallengeSource | null,
): MeetingChallenge[] {
  if (!source) return [];
  const written = (source.challenges ?? []).filter(
    (c) => c.title.trim() && c.detail.trim(),
  );
  if (written.length > 0) {
    return [...written]
      .sort((a, b) => ORDER[a.kind] - ORDER[b.kind])
      .slice(0, 3);
  }

  const derived: MeetingChallenge[] = [];
  const golden = source.goldenQuestion?.trim();
  if (golden) {
    derived.push({
      kind: "info",
      title: "Poser la question qui fait avancer l'affaire",
      detail: `« ${sansGuillemets(golden)} »`,
      why: "C'est la question qui aurait le plus changé ce rendez-vous.",
    });
  }
  const previousChallenge = source.challenge?.trim();
  if (previousChallenge) {
    derived.push({
      kind: "phrase",
      title: "Relever le défi de ce rendez-vous",
      detail: previousChallenge,
      why: "Un seul geste, à faire dès le prochain rendez-vous.",
    });
  }
  const start = source.start?.find((s) => s.trim())?.trim();
  if (start) {
    derived.push({
      kind: "geste",
      title: "Démarrer un nouveau réflexe",
      detail: start,
      why: "Ce qui manquait à ce rendez-vous pour aller plus loin.",
    });
  }
  return derived;
}
