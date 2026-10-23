import { describe, expect, it } from "@jest/globals";
import {
  challengesForDisplay,
  previousChallengesPromptBlock,
  reviewPreviousChallenges,
  meetingChallengesSchema,
  type MeetingChallenge,
} from "./meeting-challenges";

const INFO: MeetingChallenge = {
  kind: "info",
  title: "Obtenir le budget formation",
  detail: "« Quelle enveloppe avez-vous prévue pour ce projet ? »",
  why: "Sans budget, la proposition part à l'aveugle.",
};
const GESTE: MeetingChallenge = {
  kind: "geste",
  title: "Faire parler le prospect avant de présenter",
  detail: "Posez trois questions ouvertes avant la plaquette.",
  why: "Vous avez parlé 57 % du temps.",
};

describe("challengesForDisplay", () => {
  it("rend les défis écrits par le coaching, dans l'ordre info, phrase, geste", () => {
    const phrase: MeetingChallenge = { ...INFO, kind: "phrase" };
    expect(
      challengesForDisplay({ challenges: [GESTE, phrase, INFO] }).map(
        (c) => c.kind,
      ),
    ).toEqual(["info", "phrase", "geste"]);
  });

  it("tire des défis d'une analyse ancienne, sans relancer l'IA", () => {
    const challenges = challengesForDisplay({
      goldenQuestion: "« Qui signe au final ? »",
      challenge: "Annoncer le déroulé dès le début.",
      start: ["", "Proposer une date de suite avant de raccrocher."],
    });
    expect(challenges.map((d) => d.kind)).toEqual(["info", "phrase", "geste"]);
    expect(challenges[0]?.detail).toBe("« Qui signe au final ? »");
    expect(challenges[2]?.detail).toBe(
      "Proposer une date de suite avant de raccrocher.",
    );
  });

  it("ne rend rien sans coaching", () => {
    expect(challengesForDisplay(null)).toEqual([]);
    expect(challengesForDisplay({})).toEqual([]);
  });
});

describe("meetingChallengesSchema", () => {
  it("accepte de un à trois défis", () => {
    expect(meetingChallengesSchema.safeParse([INFO]).success).toBe(true);
    expect(meetingChallengesSchema.safeParse([]).success).toBe(false);
    expect(
      meetingChallengesSchema.safeParse([INFO, INFO, INFO, INFO]).success,
    ).toBe(false);
  });
});

describe("reviewPreviousChallenges", () => {
  const previous = [INFO, GESTE];
  const FROM = new Date("2026-10-14T10:00:00Z");
  const transcript = "Prospect : on a prévu une enveloppe de vingt mille euros";
  const isInTranscript = (e: string) => transcript.includes(e);

  it("garde un défi relevé dont la preuve se retrouve dans le transcript", () => {
    const [info] = reviewPreviousChallenges({
      previous,
      fromModel: [
        {
          number: 1,
          status: "releve",
          evidence: "une enveloppe de vingt mille euros",
        },
      ],
      isInTranscript,
      fromMeetingAt: FROM,
    });
    expect(info?.status).toBe("releve");
    expect(info?.evidence).toBe("une enveloppe de vingt mille euros");
    expect(info?.fromMeetingAt).toBe("2026-10-14T10:00:00.000Z");
  });

  it("rabaisse d'un cran un défi dont la preuve est introuvable", () => {
    const [info, geste] = reviewPreviousChallenges({
      previous,
      fromModel: [
        {
          number: 1,
          status: "releve",
          evidence: "un budget de cent mille euros",
        },
        { number: 2, status: "partiel", evidence: "" },
      ],
      isInTranscript,
      fromMeetingAt: FROM,
    });
    expect(info?.status).toBe("partiel");
    expect(info?.evidence).toBe("");
    expect(geste?.status).toBe("non_releve");
  });

  it("compte comme non relevé un défi que le modèle n'a pas évalué", () => {
    const review = reviewPreviousChallenges({
      previous,
      fromModel: [],
      isInTranscript,
      fromMeetingAt: FROM,
    });
    expect(review.map((r) => r.status)).toEqual(["non_releve", "non_releve"]);
  });
});

describe("previousChallengesPromptBlock", () => {
  it("numérote les défis précédents, et ne dit rien sans défi", () => {
    expect(previousChallengesPromptBlock([])).toBe("");
    const block = previousChallengesPromptBlock([INFO, GESTE]);
    expect(block).toContain("<previous_challenges>");
    expect(block).toContain("1. (info) Obtenir le budget formation");
    expect(block).toContain("2. (geste)");
    expect(block).not.toContain(String.fromCharCode(0x2014));
  });
});
