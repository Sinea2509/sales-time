import {
  dateOnlyToWallClock,
  transcriptHeaderFacts,
} from "./transcript-header";

describe("transcriptHeaderFacts", () => {
  it("lit la date et la durée d'une transcription Teams", () => {
    expect(
      transcriptHeaderFacts(
        [
          "RDV Formations Management (Noz)-20260929_150945-Transcription de la réunion",
          "29 septembre 2026, 01:09PM",
          "54min 42sec",
          "",
          "Cédric Laigneau a commencé la transcription",
        ].join("\n"),
      ),
    ).toEqual({ date: "2026-09-29", durationMin: 55 });
  });

  it("lit « 1er octobre 2026 » et « 1h 05min »", () => {
    expect(
      transcriptHeaderFacts("Réunion\n1er octobre 2026\n1h 05min 10sec"),
    ).toEqual({ date: "2026-10-01", durationMin: 65 });
  });

  it("ne prend pas une date citée plus loin dans la conversation", () => {
    const lignes = [
      "Julien : Bonjour Claire.",
      "Claire : Bonjour.",
      "Julien : On fait le point.",
      "Claire : D'accord.",
      "Julien : Très bien.",
      "Claire : Allons-y.",
      "Julien : La convention a lieu le 15 janvier 2027.",
    ];
    expect(transcriptHeaderFacts(lignes.join("\n"))).toEqual({
      date: null,
      durationMin: null,
    });
  });
});

describe("dateOnlyToWallClock", () => {
  it("met une date sans heure à midi, et refuse le reste", () => {
    expect(dateOnlyToWallClock("2026-09-29")).toBe("2026-09-29T12:00");
    expect(dateOnlyToWallClock("2026-09-29T16:30")).toBeNull();
  });
});
