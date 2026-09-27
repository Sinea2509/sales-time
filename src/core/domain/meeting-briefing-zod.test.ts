import { describe, expect, it } from "@jest/globals";
import { meetingBriefingSchema } from "./meeting-briefing-zod";

describe("meetingBriefingSchema", () => {
  it("parses a valid briefing payload", () => {
    const parsed = meetingBriefingSchema.safeParse({
      lastMeetingSummary: "Dernier RDV positif, budget validé en comité.",
      discDominant: "S",
      soncasDominant: "securite",
      startActions: ["Préparer ROI"],
      customQuestions: ["Qui décide ?", "Quel calendrier ?"],
      openPoints: ["Pricing à clarifier"],
      stageAdvice: "Insister sur la preuve sociale.",
      genericAdvice: false,
      exitGoal: "Repartir avec une date et le nom du décideur.",
      trapToAvoid: "La démonstration improvisée.",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects too many custom questions", () => {
    const parsed = meetingBriefingSchema.safeParse({
      lastMeetingSummary: "x",
      discDominant: null,
      soncasDominant: null,
      startActions: [],
      customQuestions: Array.from({ length: 9 }, (_, i) => `q${i}`),
      openPoints: [],
      stageAdvice: "y",
      genericAdvice: true,
      exitGoal: "z",
      trapToAvoid: "w",
    });

    expect(parsed.success).toBe(false);
  });
});
