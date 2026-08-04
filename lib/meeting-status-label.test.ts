import {
  meetingStatusBadgeClass,
  meetingStatusLabel,
} from "@/lib/meeting-status-label";

describe("meetingStatusLabel", () => {
  it("returns French labels for known statuses", () => {
    expect(meetingStatusLabel("PROCESSING")).toBe("Analyse en cours");
    expect(meetingStatusLabel("READY")).toBe("Prêt");
  });

  it("falls back for unknown status strings", () => {
    expect(meetingStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    // Le repli porte la surface discrète de la charte, pas une couleur de
    // statut : un état inconnu ne doit ni alarmer ni féliciter.
    expect(meetingStatusBadgeClass("UNKNOWN")).toContain("bg-muted");
  });
});
