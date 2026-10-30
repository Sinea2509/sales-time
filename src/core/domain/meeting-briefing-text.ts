import type { MeetingBriefingResult } from "./meeting-briefing-zod";
import type { MeetingChallenge } from "./meeting-challenges";

/**
 * Le briefing en texte simple, pour le coller dans le CRM ou un message. Les
 * rubriques vides n'y figurent pas.
 */
export function meetingBriefingAsText(
  briefing: MeetingBriefingResult,
  input: {
    personName: string | null;
    targetStage: string;
    challenges: readonly MeetingChallenge[];
  },
): string {
  const lines = [
    `BRIEFING · ${input.personName ?? "Prospect"} · ${input.targetStage}`,
  ];
  const rubrique = (titre: string, contenu: readonly string[]) => {
    const kept = contenu.map((c) => c.trim()).filter(Boolean);
    if (kept.length > 0) lines.push("", titre, ...kept);
  };
  const puces = (items: readonly string[]) =>
    items
      .map((i) => i.trim())
      .filter(Boolean)
      .map((i) => `- ${i}`);

  rubrique("OÙ EN EST L'AFFAIRE", [briefing.lastMeetingSummary]);
  rubrique("OBJECTIF DU RENDEZ-VOUS", [briefing.meetingGoal]);
  rubrique("QUESTION EN OR", [
    briefing.goldenQuestion,
    briefing.goldenQuestionWhy,
  ]);
  rubrique("COMMENT LUI PARLER", [briefing.howToTalk]);
  rubrique("QUESTIONS À POSER", puces(briefing.customQuestions));
  rubrique(
    "OBJECTIONS À ANTICIPER",
    briefing.likelyObjections.map((o) => `- ${o.objection} : ${o.answer}`),
  );
  rubrique(
    "VOS DÉFIS DU DERNIER RENDEZ-VOUS",
    input.challenges.map((d) => `- ${d.title} : ${d.detail}`),
  );
  rubrique("À PRÉPARER AVANT LE RENDEZ-VOUS", puces(briefing.startActions));
  rubrique("POINTS OUVERTS", puces(briefing.openPoints));
  rubrique("CONSEILS POUR L'ÉTAPE", [briefing.stageAdvice]);
  return lines.join("\n");
}
