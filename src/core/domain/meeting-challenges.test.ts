import { describe, expect, it } from "@jest/globals";
import {
  challengesForDisplay,
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
