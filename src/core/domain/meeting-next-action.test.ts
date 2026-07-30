import { describe, expect, it } from "@jest/globals";
import {
  filterMeetingsByTodoCategory,
  meetingNextAction,
  meetingsTodoSummary,
  type MeetingActionInput,
} from "./meeting-next-action";

function meeting(over: Partial<MeetingActionInput> = {}): MeetingActionInput {
  return {
    status: "READY",
    outcome: "OTHER",
    hasKiss: true,
    salesScore: 70,
    followUpEmailDraft: null,
    ...over,
  };
}

describe("meetingNextAction", () => {
  it("dit d'attendre tant que l'analyse tourne", () => {
    expect(meetingNextAction(meeting({ status: "PENDING" })).label).toBe(
      "Analyse en cours",
    );
    expect(meetingNextAction(meeting({ status: "PROCESSING" })).tone).toBe(
      "waiting",
    );
  });

  it("demande de relancer une analyse échouée", () => {
    const a = meetingNextAction(meeting({ status: "FAILED" }));
    expect(a.label).toBe("Analyse à relancer");
    expect(a.category).toBe("analyse");
  });

  it("demande d'analyser un rendez-vous sans coaching ni score", () => {
    const a = meetingNextAction(meeting({ hasKiss: false, salesScore: null }));
    expect(a).toEqual({
      label: "À analyser",
      tone: "todo",
      category: "analyse",
    });
  });

  it("l'analyse prime sur l'issue : un rendez-vous non analysé reste à analyser", () => {
    // Même gagné, sans analyse il n'y a pas de coaching à en tirer.
    const a = meetingNextAction(
      meeting({ hasKiss: false, salesScore: null, outcome: "WON" }),
    );
    expect(a.label).toBe("À analyser");
  });

  it("marque gagné et perdu comme des fins, sans action", () => {
    expect(meetingNextAction(meeting({ outcome: "WON" }))).toEqual({
      label: "Gagné",
      tone: "won",
      category: null,
    });
    expect(meetingNextAction(meeting({ outcome: "LOST" }))).toEqual({
      label: "Perdu",
      tone: "lost",
      category: null,
    });
  });

  it("distingue une relance à écrire d'une relance déjà prête", () => {
    const aRelancer = meetingNextAction(meeting({ outcome: "FOLLOW_UP" }));
    expect(aRelancer).toEqual({
      label: "À relancer",
      tone: "todo",
      category: "relance",
    });
    const relanceReady = meetingNextAction(
      meeting({ outcome: "FOLLOW_UP", followUpEmailDraft: "Bonjour..." }),
    );
    expect(relanceReady.label).toBe("Relance prête");
    expect(relanceReady.category).toBeNull();
  });

  it("reconnaît l'analyse par le seul score, sans KISS", () => {
    const a = meetingNextAction(
      meeting({ hasKiss: false, salesScore: 55, outcome: "OTHER" }),
    );
    expect(a.label).toBe("Analysé");
  });
});

describe("meetingsTodoSummary", () => {
  it("compte séparément les rendez-vous à analyser et à relancer", () => {
    const resume = meetingsTodoSummary([
      meeting({ hasKiss: false, salesScore: null }), // à analyser
      meeting({ status: "FAILED" }), // à analyser (échec)
      meeting({ outcome: "FOLLOW_UP" }), // à relancer
      meeting({ outcome: "WON" }), // rien
      meeting({ status: "PROCESSING" }), // rien (en cours)
      meeting({ outcome: "FOLLOW_UP", followUpEmailDraft: "x" }), // rien (prête)
    ]);
    expect(resume).toEqual({ aAnalyser: 2, aRelancer: 1 });
  });

  it("rend deux zéros sur une liste vide", () => {
    expect(meetingsTodoSummary([])).toEqual({ aAnalyser: 0, aRelancer: 0 });
  });
});

describe("filterMeetingsByTodoCategory", () => {
  const liste = [
    { ...meeting({ hasKiss: false, salesScore: null }), id: "a" }, // à analyser
    { ...meeting({ status: "FAILED" }), id: "b" }, // à analyser (échec)
    { ...meeting({ outcome: "FOLLOW_UP" }), id: "c" }, // à relancer
    { ...meeting({ outcome: "WON" }), id: "d" }, // rien
    { ...meeting({ status: "PROCESSING" }), id: "e" }, // rien (en cours)
  ];

  it("ne retient que les rendez-vous à analyser", () => {
    expect(
      filterMeetingsByTodoCategory(liste, "analyse").map((m) => m.id),
    ).toEqual(["a", "b"]);
  });

  it("ne retient que les rendez-vous à relancer", () => {
    expect(
      filterMeetingsByTodoCategory(liste, "relance").map((m) => m.id),
    ).toEqual(["c"]);
  });

  it("rend la liste entière sans catégorie", () => {
    expect(filterMeetingsByTodoCategory(liste, null).map((m) => m.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });

  it("garde l'ordre reçu et ne touche pas la liste d'origine", () => {
    const filtre = filterMeetingsByTodoCategory(liste, null);
    expect(filtre).not.toBe(liste);
    expect(filtre).toEqual(liste);
  });

  it("rend une liste vide quand rien n'appelle ce geste", () => {
    const clos = [meeting({ outcome: "WON" }), meeting({ outcome: "LOST" })];
    expect(filterMeetingsByTodoCategory(clos, "analyse")).toEqual([]);
  });
});
