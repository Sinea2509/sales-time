import { describe, expect, it } from "@jest/globals";
import { toMobileMeeting } from "./mobile-meeting";

const row = {
  id: "meet_1",
  prospectName: "Claire Morel",
  prospectCompany: "Vicat",
  meetingAt: new Date("2026-11-09T13:30:00.000Z"),
  durationMin: 47,
  outcome: "FOLLOW_UP" as const,
  status: "READY" as const,
  transcript: "jamais envoyé au téléphone",
};

describe("toMobileMeeting", () => {
  it("rend le SalesScore et le chemin de la fiche, jamais le transcript", () => {
    const out = toMobileMeeting({ ...row, salesScore: 82 });

    expect(out).toEqual({
      id: "meet_1",
      prospectName: "Claire Morel",
      prospectCompany: "Vicat",
      meetingAt: "2026-11-09T13:30:00.000Z",
      durationMin: 47,
      outcome: "FOLLOW_UP",
      status: "READY",
      salesScore: 82,
      webPath: "/company/rendez-vous/meet_1",
    });
    expect(JSON.stringify(out)).not.toContain("transcript");
  });

  it("laisse le score vide quand la fiche n'a pas de grille", () => {
    expect(toMobileMeeting(row).salesScore).toBeNull();
  });
});
