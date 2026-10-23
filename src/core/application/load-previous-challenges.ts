import { kissResultSchema } from "@/src/core/domain/kiss-result-zod";
import {
  challengesForDisplay,
  reviewPreviousChallenges,
  type ChallengeReview,
  type ChallengeReviewFromModel,
  type MeetingChallenge,
} from "@/src/core/domain/meeting-challenges";
import {
  evidenceWords,
  isExcerptInSource,
} from "@/src/core/domain/transcript-evidence";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

export type PreviousChallenges = {
  challenges: MeetingChallenge[];
  fromMeetingId: string;
  fromMeetingAt: Date;
};

/**
 * Les défis laissés au dernier rendez-vous analysé avec le même contact,
 * avant celui-ci : ce sont eux que l'analyse de ce rendez-vous vérifie.
 *
 * `null` quand il n'y a pas de rendez-vous précédent, qu'il n'a pas de
 * coaching, ou qu'une lecture échoue : la vérification est un bonus, elle ne
 * doit jamais empêcher une analyse d'aboutir.
 */
export async function loadPreviousChallenges(
  deps: { meetings: MeetingRepositoryPort },
  input: {
    organizationId: string;
    meeting: { id: string; personId: string; meetingAt: Date };
  },
): Promise<PreviousChallenges | null> {
  try {
    const history = await deps.meetings.listMeetingsForPersonOrdered({
      organizationId: input.organizationId,
      personId: input.meeting.personId,
      limit: 10,
    });
    const before = history
      .filter(
        (m) =>
          m.id !== input.meeting.id &&
          m.meetingAt.getTime() < input.meeting.meetingAt.getTime(),
      )
      .sort((a, b) => b.meetingAt.getTime() - a.meetingAt.getTime());

    for (const previous of before) {
      const kiss = await deps.meetings.findLatestAnalysisForMeeting({
        meetingId: previous.id,
        organizationId: input.organizationId,
        kind: "KISS",
      });
      if (!kiss) continue;
      const read = kissResultSchema.safeParse(kiss.result);
      if (!read.success) continue;
      const challenges = challengesForDisplay({
        challenges: read.data.challenges ?? null,
        goldenQuestion: read.data.goldenQuestion,
        challenge: read.data.challenge ?? null,
        start: read.data.start,
      });
      if (challenges.length === 0) continue;
      return {
        challenges,
        fromMeetingId: previous.id,
        fromMeetingAt: previous.meetingAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Ajoute au coaching le bilan vérifié des défis précédents : le statut que le
 * modèle a donné à chacun, rabaissé quand sa preuve ne se retrouve pas dans
 * le transcript de ce rendez-vous.
 */
export function withChallengesReview<
  T extends { previousChallengesReview?: ChallengeReviewFromModel[] },
>(
  result: T,
  previous: PreviousChallenges | null,
  transcript: string,
): T & { challengesReview?: ChallengeReview[] } {
  if (!previous) return result;
  const words = evidenceWords(transcript);
  return {
    ...result,
    challengesReview: reviewPreviousChallenges({
      previous: previous.challenges,
      fromModel: result.previousChallengesReview ?? [],
      isInTranscript: (excerpt) => isExcerptInSource(excerpt, words),
      fromMeetingAt: previous.fromMeetingAt,
    }),
  };
}
