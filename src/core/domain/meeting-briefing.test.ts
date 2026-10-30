import { describe, expect, it } from "@jest/globals";
import { meetingBriefingHistoryEntry } from "./meeting-briefing";
import { meetingBriefingAsText } from "./meeting-briefing-text";
import type { MeetingBriefingResult } from "./meeting-briefing-zod";
import { DECOUVERTE_V2_GRID } from "./scorecard-grid";

const SOURCE = {
  meetingAt: "2026-10-21T10:00",
  meetingType: "Découverte",
  pipelineStage: "Qualifié",
  visitReportDraft: null,
  analyses: [],
};

const KISS = {
  keep: ["k"],
  improve: ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  stop: ["s"],
  start: ["Question 1"],
  goldenQuestion: "Qui aura le dernier mot ?",
  coachingScore: 7,
  coachingScoreJustification: "j",
  challenge: "Poser la date.",
  summary: "Bon échange sur le besoin.",
};

describe("meetingBriefingHistoryEntry", () => {
  it("laisse vides les rubriques d'un rendez-vous sans analyse", () => {
    expect(meetingBriefingHistoryEntry(SOURCE)).toEqual({
      meetingAt: "2026-10-21T10:00",
      meetingType: "Découverte",
      stage: "Qualifié",
      summary: null,
      essentials: null,
      disc: null,
      soncas: null,
      goldenQuestion: null,
      challenges: [],
      customQuestions: [],
      openPoints: [],
      objections: [],
      missing: [],
    });
  });

  it("lit la question en or, les défis et les points du coaching", () => {
    const entry = meetingBriefingHistoryEntry({
      ...SOURCE,
      analyses: [{ kind: "KISS", result: KISS }],
    });
    expect(entry.summary).toBe("Bon échange sur le besoin.");
    expect(entry.goldenQuestion).toBe("Qui aura le dernier mot ?");
    expect(entry.challenges.length).toBeGreaterThan(0);
    expect(entry.openPoints).toHaveLength(4);
  });

  it("lit les objections et les manques de la grille", () => {
    const entry = meetingBriefingHistoryEntry({
      ...SOURCE,
      analyses: [
        {
          kind: "OBJECTIONS",
          result: {
            summary: "s",
            objections: [
              {
                objection: "C'est trop cher.",
                who: "Le prospect",
                moment: null,
                response: "Vous avez parlé du retour sur investissement.",
                effect: "Il reste réservé.",
                outcome: "open",
                suggestion: "Chiffrez le coût du statu quo.",
              },
            ],
          },
        },
        {
          kind: "SCORECARD",
          result: {
            gridId: DECOUVERTE_V2_GRID.id,
            gridName: DECOUVERTE_V2_GRID.name,
            overallScore: 40,
            blocks: [],
            criteria: [],
            summary: "S",
            pointsLost: [
              {
                key: "C6",
                evidence: "Vous n'avez pas demandé ce qui bloquerait.",
                whatToSayInstead: "Qu'est-ce qui pourrait freiner le projet ?",
              },
            ],
          },
        },
      ],
    });
    expect(entry.objections).toEqual([
      {
        objection: "C'est trop cher.",
        outcome: "open",
        response: "Vous avez parlé du retour sur investissement.",
        suggestion: "Chiffrez le coût du statu quo.",
      },
    ]);
    expect(entry.missing).toEqual([
      {
        criterion: "Freins et risques",
        missing: "Vous n'avez pas demandé ce qui bloquerait.",
        advice: "Qu'est-ce qui pourrait freiner le projet ?",
      },
    ]);
  });

  it("ne garde que l'essentiel du compte rendu", () => {
    const entry = meetingBriefingHistoryEntry({
      ...SOURCE,
      visitReportDraft:
        "COMPTE RENDU DE VISITE\nHélène\n\nL'ESSENTIEL\n- Besoin : former\n\nDÉTAIL DU RENDEZ-VOUS\nLong détail",
    });
    expect(entry.essentials).toContain("- Besoin : former");
    expect(entry.essentials).not.toContain("Long détail");
  });

  it("ignore une analyse illisible plutôt que d'échouer", () => {
    const entry = meetingBriefingHistoryEntry({
      ...SOURCE,
      analyses: [{ kind: "KISS", result: { illisible: true } }],
    });
    expect(entry.summary).toBeNull();
    expect(entry.challenges).toEqual([]);
  });
});

describe("meetingBriefingAsText", () => {
  const BRIEFING: MeetingBriefingResult = {
    lastMeetingSummary: "L'affaire avance.",
    discDominant: "I",
    soncasDominant: null,
    meetingGoal: "Obtenir le budget.",
    goldenQuestion: "Qu'est-ce qui ferait de ce projet une réussite ?",
    goldenQuestionWhy: "Les critères de succès manquent.",
    howToTalk: "",
    startActions: ["Relire le compte rendu"],
    customQuestions: ["Quel calendrier ?"],
    likelyObjections: [
      { objection: "C'est trop cher", answer: "Chiffrez le statu quo." },
    ],
    openPoints: [],
    stageAdvice: "Restez sur le besoin.",
    genericAdvice: false,
  };

  const texte = meetingBriefingAsText(BRIEFING, {
    personName: "Claire Morel",
    targetStage: "Proposition",
    challenges: [
      {
        kind: "info",
        title: "Obtenir le budget",
        detail: "« Quelle enveloppe prévoyez-vous ? »",
        why: "w",
      },
    ],
  });

  it("met la question en or et son pourquoi dans la fiche à copier", () => {
    expect(texte).toContain("BRIEFING · Claire Morel · Proposition");
    expect(texte).toContain(
      "QUESTION EN OR\nQu'est-ce qui ferait de ce projet une réussite ?\nLes critères de succès manquent.",
    );
  });

  it("reprend les objections et les défis", () => {
    expect(texte).toContain("- C'est trop cher : Chiffrez le statu quo.");
    expect(texte).toContain(
      "- Obtenir le budget : « Quelle enveloppe prévoyez-vous ? »",
    );
  });

  it("n'écrit pas de rubrique vide", () => {
    expect(texte).not.toContain("COMMENT LUI PARLER");
    expect(texte).not.toContain("POINTS OUVERTS");
  });

  it("écrit « Prospect » faute de nom", () => {
    expect(
      meetingBriefingAsText(BRIEFING, {
        personName: null,
        targetStage: "Proposition",
        challenges: [],
      }),
    ).toContain("BRIEFING · Prospect · Proposition");
  });
});
