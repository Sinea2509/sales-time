import { describe, expect, it, jest } from "@jest/globals";
import {
  loadPreviousChallenges,
  withChallengesReview,
} from "./load-previous-challenges";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

const ORG = "org";
const CURRENT = {
  id: "m3",
  personId: "p1",
  meetingAt: new Date("2026-10-20T10:00:00Z"),
};

const KISS_WITH_CHALLENGES = {
  keep: [],
  improve: [],
  stop: [],
  start: [],
  goldenQuestion: "Qui signe ?",
  coachingScore: 6,
  coachingScoreJustification: "Correct.",
  summary: "Vous avez avancé.",
  challenges: [
    {
      kind: "info",
      title: "Obtenir le budget",
      detail: "« Quelle enveloppe avez-vous prévue ? »",
      why: "Pour chiffrer juste.",
    },
  ],
};

function meetingsReturning(
  history: { id: string; meetingAt: Date }[],
  kissByMeeting: Record<string, unknown>,
): MeetingRepositoryPort {
  return {
    listMeetingsForPersonOrdered: jest.fn(async () => history),
    findLatestAnalysisForMeeting: jest.fn(
      async ({ meetingId }: { meetingId: string }) =>
        kissByMeeting[meetingId] ? { result: kissByMeeting[meetingId] } : null,
    ),
  } as unknown as MeetingRepositoryPort;
}

describe("loadPreviousChallenges", () => {
  it("prend les défis du dernier rendez-vous coaché avant celui-ci", async () => {
    const meetings = meetingsReturning(
      [
        CURRENT,
        { id: "m2", meetingAt: new Date("2026-10-14T10:00:00Z") },
        { id: "m1", meetingAt: new Date("2026-10-01T10:00:00Z") },
        { id: "m4", meetingAt: new Date("2026-10-25T10:00:00Z") },
      ],
      { m2: KISS_WITH_CHALLENGES, m1: KISS_WITH_CHALLENGES },
    );
    const previous = await loadPreviousChallenges(
      { meetings },
      { organizationId: ORG, meeting: CURRENT },
    );
    expect(previous?.fromMeetingId).toBe("m2");
    expect(previous?.challenges[0]?.title).toBe("Obtenir le budget");
  });

  it("ne rend rien sans rendez-vous précédent coaché", async () => {
    const meetings = meetingsReturning([CURRENT], {});
    expect(
      await loadPreviousChallenges(
        { meetings },
        { organizationId: ORG, meeting: CURRENT },
      ),
    ).toBeNull();
  });

  it("n'empêche jamais l'analyse quand une lecture échoue", async () => {
    const meetings = {
      listMeetingsForPersonOrdered: jest.fn(async () => {
        throw new Error("base indisponible");
      }),
    } as unknown as MeetingRepositoryPort;
    expect(
      await loadPreviousChallenges(
        { meetings },
        { organizationId: ORG, meeting: CURRENT },
      ),
    ).toBeNull();
  });
});

describe("withChallengesReview", () => {
  const previous = {
    challenges: [
      {
        kind: "info" as const,
        title: "Obtenir le budget",
        detail: "« Quelle enveloppe avez-vous prévue ? »",
        why: "",
      },
    ],
    fromMeetingId: "m2",
    fromMeetingAt: new Date("2026-10-14T10:00:00Z"),
  };
  const transcript =
    "Commercial : quelle enveloppe avez-vous prévue ?\nProspect : environ vingt mille euros pour l'année.";

  it("garde un défi relevé dont la preuve est dans le transcript", () => {
    const out = withChallengesReview(
      {
        previousChallengesReview: [
          {
            number: 1,
            status: "releve" as const,
            evidence: "environ vingt mille euros pour l'année",
          },
        ],
      },
      previous,
      transcript,
    );
    expect(out.challengesReview?.[0]?.status).toBe("releve");
  });

  it("ne touche à rien sans défi précédent", () => {
    const result = { previousChallengesReview: [] };
    expect(withChallengesReview(result, null, transcript)).toBe(result);
  });
});
