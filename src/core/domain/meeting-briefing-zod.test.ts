import { describe, expect, it } from "@jest/globals";
import { meetingBriefingSchema } from "./meeting-briefing-zod";

const briefing = {
  lastMeetingSummary: "Dernier RDV positif, budget validé en comité.",
  discDominant: "S",
  soncasDominant: "securite",
  meetingGoal: "Obtenir le nom du décideur final.",
  goldenQuestion: "Qui, chez vous, aura le dernier mot sur ce projet ?",
  goldenQuestionWhy: "Le circuit de décision reste flou.",
  howToTalk: "Rassurez avec des exemples proches, sans presser.",
  startActions: ["Préparer ROI"],
  customQuestions: ["Qui décide ?", "Quel calendrier ?"],
  likelyObjections: [
    { objection: "C'est trop cher", answer: "Revenez au coût du statu quo." },
  ],
  openPoints: ["Pricing à clarifier"],
  stageAdvice: "Insister sur la preuve sociale.",
  genericAdvice: false,
};

describe("meetingBriefingSchema", () => {
  it("parses a valid briefing payload", () => {
    expect(meetingBriefingSchema.safeParse(briefing).success).toBe(true);
  });

  it("rejects too many custom questions", () => {
    const parsed = meetingBriefingSchema.safeParse({
      ...briefing,
      customQuestions: Array.from({ length: 9 }, (_, i) => `q${i}`),
    });

    expect(parsed.success).toBe(false);
  });

  it("exige la question en or : le modèle ne peut pas l'omettre", () => {
    const sansQuestion: Partial<typeof briefing> = { ...briefing };
    delete sansQuestion.goldenQuestion;
    expect(meetingBriefingSchema.safeParse(sansQuestion).success).toBe(false);
  });

  it("n'a aucun champ facultatif, que les formats imposés d'OpenAI refusent", () => {
    for (const [cle, champ] of Object.entries(meetingBriefingSchema.shape)) {
      expect([cle, champ.isOptional()]).toEqual([cle, false]);
    }
  });
});
