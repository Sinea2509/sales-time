import { describe, expect, it } from "@jest/globals";
import { mobileDebrief } from "./mobile-debrief";

/* La note vient de la grille : on vérifie ici qu'elle lit la bonne analyse. */
jest.mock("@/src/core/domain/dashboard-sales-score", () => ({
  salesScoreForMeeting: ({ scorecardResult }: { scorecardResult: unknown }) =>
    (scorecardResult as { overallScore?: number } | null)?.overallScore ?? null,
}));

const kiss = {
  keep: ["k"],
  improve: ["i"],
  stop: ["s"],
  start: ["t"],
  goldenQuestion: "Qu'est-ce qui vous ferait signer avant mars ?",
  challenge: "Reformuler le besoin",
  coachingScore: 7,
  coachingScoreJustification: "j",
  summary: "Bonne écoute, la conclusion manque de prochaine étape datée.",
  challenges: [
    {
      kind: "geste",
      title: "Fixer la prochaine étape",
      detail: "Proposez une date avant de partir.",
      why: "Sans date, l'affaire s'endort.",
    },
    {
      kind: "info",
      title: "Obtenir le budget formation",
      detail: "« Quelle enveloppe avez-vous prévue pour 2027 ? »",
      why: "Le chiffrage en dépend.",
    },
  ],
  previousChallengesReview: [],
};

const at = (iso: string) => new Date(iso);

describe("mobileDebrief", () => {
  it("rend la note, les défis dans l'ordre de la fiche, le mail et le compte rendu", () => {
    const out = mobileDebrief({
      followUpEmailDraft: "Objet : Suite à notre échange\n\nBonjour Claire,",
      visitReportDraft: "  Compte rendu  ",
      analyses: [
        { kind: "KISS", result: kiss, createdAt: at("2026-11-09T10:00:00Z") },
        {
          kind: "SCORECARD",
          result: { overallScore: 82 },
          createdAt: at("2026-11-09T10:00:00Z"),
        },
      ],
    });

    expect(out.salesScore).toBe(82);
    expect(out.challenges.map((c) => c.title)).toEqual([
      "Obtenir le budget formation",
      "Fixer la prochaine étape",
    ]);
    expect(out.coachingSummary).toBe(kiss.summary);
    expect(out.followUpEmail).toEqual({
      subject: "Suite à notre échange",
      body: "Bonjour Claire,",
    });
    expect(out.visitReport).toBe("Compte rendu");
  });

  it("lit la dernière analyse quand le rendez-vous a été relancé", () => {
    const out = mobileDebrief({
      followUpEmailDraft: null,
      visitReportDraft: null,
      analyses: [
        {
          kind: "SCORECARD",
          result: { overallScore: 40 },
          createdAt: at("2026-11-09T10:00:00Z"),
        },
        {
          kind: "SCORECARD",
          result: { overallScore: 71 },
          createdAt: at("2026-11-09T12:00:00Z"),
        },
      ],
    });

    expect(out.salesScore).toBe(71);
  });

  it("laisse vide ce qui n'est pas encore écrit, sans inventer", () => {
    const out = mobileDebrief({
      followUpEmailDraft: "   ",
      visitReportDraft: null,
      analyses: [
        {
          kind: "KISS",
          result: { invalide: true },
          createdAt: at("2026-11-09T10:00:00Z"),
        },
      ],
    });

    expect(out).toEqual({
      salesScore: null,
      challenges: [],
      coachingSummary: null,
      followUpEmail: null,
      visitReport: null,
    });
  });
});
