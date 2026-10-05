import { describe, expect, it } from "@jest/globals";
import { kissStopWithTalkShare } from "./kiss-talk-share-stop";
import type { TalkShare } from "./talk-share-from-transcript";

const PARLE_TROP: TalkShare = {
  commercialLabel: "Cédric",
  prospectLabel: "Lisa",
  commercialPct: 60,
  prospectPct: 40,
  longestCommercialRunWords: 576,
  rolesRecognized: true,
  rolesBasis: "organizer",
};

describe("kissStopWithTalkShare", () => {
  it("ajoute en tête de « à arrêter » la parole mesurée quand le commercial dépasse 50 %", () => {
    const out = kissStopWithTalkShare({ stop: [] as string[] }, PARLE_TROP);
    expect(out.stop).toHaveLength(1);
    expect(out.stop[0]).toContain("60 %");
    expect(out.stop[0]).toContain("576 mots");
  });

  it("ne double pas une puce qui parle déjà du temps de parole", () => {
    const stop = [
      "Le commercial monopolise la parole pendant la présentation.",
    ];
    expect(kissStopWithTalkShare({ stop }, PARLE_TROP).stop).toEqual(stop);
  });

  it("ne touche à rien sous le plafond ou sans mesure", () => {
    const result = { stop: [] as string[] };
    expect(
      kissStopWithTalkShare(result, {
        ...PARLE_TROP,
        commercialPct: 45,
        prospectPct: 55,
      }),
    ).toBe(result);
    expect(kissStopWithTalkShare(result, null)).toBe(result);
  });
});
