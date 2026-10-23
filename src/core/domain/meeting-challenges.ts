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

/*
  La vérification des défis, au rendez-vous suivant avec le même contact.

  Demande de Thomas du 23 octobre 2026. Le modèle dit, pour chaque défi
  laissé la fois précédente, s'il a été relevé, avec les mots du transcript
  qui le prouvent ; le produit vérifie ces mots. Comme pour la grille (lot
  92), dans le doute on ne monte pas : un défi n'est relevé que si sa preuve
  se retrouve dans le transcript.
*/
export const CHALLENGE_REVIEW_STATUSES = [
  "releve",
  "partiel",
  "non_releve",
] as const;

export type ChallengeReviewStatus = (typeof CHALLENGE_REVIEW_STATUSES)[number];

/** Ce que le modèle rend pour les défis du rendez-vous précédent. */
export const challengeReviewModelSchema = z
  .array(
    z.object({
      number: z
        .number()
        .int()
        .min(1)
        .max(3)
        .describe("Le numéro du défi dans le bloc <previous_challenges>."),
      status: z
        .enum(CHALLENGE_REVIEW_STATUSES)
        .describe(
          "releve : fait pleinement ; partiel : amorcé mais incomplet ; non_releve : pas fait.",
        ),
      evidence: z
        .string()
        .max(300)
        .describe(
          "Les mots du transcript qui le prouvent, recopiés exactement (trois mots au moins). Vide si le défi n'a pas été relevé.",
        ),
    }),
  )
  .max(3);

export type ChallengeReviewFromModel = z.infer<
  typeof challengeReviewModelSchema
>[number];

/** Un défi du rendez-vous précédent, tel que la fiche l'affiche. */
export const challengeReviewSchema = z.object({
  kind: z.enum(MEETING_CHALLENGE_KINDS),
  title: z.string(),
  detail: z.string(),
  status: z.enum(CHALLENGE_REVIEW_STATUSES),
  evidence: z.string(),
  /** La date du rendez-vous qui avait laissé ce défi, en ISO. */
  fromMeetingAt: z.string(),
});

export type ChallengeReview = z.infer<typeof challengeReviewSchema>;

/**
 * Le bloc qui donne au modèle les défis du rendez-vous précédent, numérotés.
 * Vide quand il n'y en a pas.
 */
export function previousChallengesPromptBlock(
  previous: readonly MeetingChallenge[],
): string {
  if (previous.length === 0) return "";
  return [
    "<previous_challenges>",
    ...previous.map((c, i) => `${i + 1}. (${c.kind}) ${c.title} : ${c.detail}`),
    "</previous_challenges>",
  ].join("\n");
}

/**
 * Le bilan des défis précédents : chaque défi reçoit son statut, rabaissé
 * quand la preuve citée ne se retrouve pas dans le transcript. Un défi que le
 * modèle n'a pas évalué compte comme non relevé.
 */
export function reviewPreviousChallenges(input: {
  previous: readonly MeetingChallenge[];
  fromModel: readonly ChallengeReviewFromModel[];
  /** Vrai si l'extrait se retrouve dans le transcript de ce rendez-vous. */
  isInTranscript: (excerpt: string) => boolean;
  fromMeetingAt: Date;
}): ChallengeReview[] {
  return input.previous.map((challenge, index) => {
    const said = input.fromModel.find((r) => r.number === index + 1);
    const evidence = said?.evidence.trim() ?? "";
    const proven = evidence.length > 0 && input.isInTranscript(evidence);
    // Sans preuve retrouvée, un cran de moins : « relevé » devient « en
    // partie », « en partie » devient « pas encore ».
    let status: ChallengeReviewStatus = said?.status ?? "non_releve";
    if (!proven) {
      status = status === "releve" ? "partiel" : "non_releve";
    }
    return {
      kind: challenge.kind,
      title: challenge.title,
      detail: challenge.detail,
      status,
      evidence: proven ? evidence : "",
      fromMeetingAt: input.fromMeetingAt.toISOString(),
    };
  });
}
