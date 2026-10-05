import { describe, expect, it } from "@jest/globals";
import { transcriptSides } from "./talk-share-from-transcript";

describe("transcriptSides", () => {
  it("sépare les paroles du commercial de celles du prospect", () => {
    const sides = transcriptSides(
      [
        "Cédric Laigneau a commencé la transcription",
        "",
        "Lisa ANDROLUS   0:03",
        "On a déjà essayé d'autres prestataires.",
        "",
        "Cédric Laigneau   0:10",
        "Qu'est-ce qui n'a pas marché ?",
        "",
        "Lisa ANDROLUS   0:15",
        "La qualité des consultants.",
        "",
        "Cédric Laigneau   0:20",
        "Je vois, chez Saint-Gobain on a fait autrement.",
      ].join("\n"),
    );
    expect(sides?.seller).toContain("Saint-Gobain");
    expect(sides?.prospect).toContain("prestataires");
    expect(sides?.prospect).not.toContain("Saint-Gobain");
    expect(sides?.rolesRecognized).toBe(true);
  });

  it("rend null pour un texte d'un seul bloc", () => {
    expect(transcriptSides("Un long texte sans intervenant.")).toBeNull();
  });
});
