import { describe, expect, it } from "@jest/globals";
import { libelleATravailler, libellePointFort } from "@/lib/competence-focus";
import {
  essentielDuManager,
  type MembreClasseDeLaDispersion,
} from "@/lib/essentiel-du-manager";
import type { SellerSkillSignature } from "@/src/core/domain/seller-skill-signature";

const SIGNATURE: SellerSkillSignature = {
  fort: "ecouteActive",
  ecartFort: 17,
  faible: "assertivite",
  ecartFaible: -12,
};

describe("libellés de focus de compétence", () => {
  it("écrit le point fort et l'axe d'amélioration avec leur écart signé", () => {
    expect(libellePointFort(SIGNATURE)).toBe("Point fort · Écoute active +17");
    expect(libelleATravailler(SIGNATURE)).toBe(
      "Axe d'amélioration · Assertivité −12",
    );
  });

  it("porte le vrai signe moins, jamais un trait d'union", () => {
    expect(libelleATravailler(SIGNATURE)).toContain("−12");
    expect(libelleATravailler(SIGNATURE)).not.toContain("-12");
  });

  /*
    Le point de tout ce fichier : le manager et le commercial lisent le même
    signal sur la même personne. Ce test relie les deux, en vérifiant que la
    carte « à coacher » du manager écrit exactement la phrase que l'accueil du
    commercial affichera. S'ils se mettaient à diverger, il casse.
  */
  it("dit exactement ce que la carte de priorité du manager écrit", () => {
    const membre: MembreClasseDeLaDispersion = {
      userId: "u1",
      firstName: "Camille",
      lastName: "Reynaud",
      email: "c@test.fr",
      noteOn5: 4.3,
      rang: 1,
    };
    const essentiel = essentielDuManager({
      dispersion: [membre, { ...membre, userId: "u2", rang: 2, noteOn5: 3 }],
      rows: [{ userId: "u1", skillSignature: SIGNATURE }],
      ranking: {
        rankedCount: 2,
        unrankedNoScoreCount: 0,
        unrankedLowVolumeCount: 0,
        minScoredMeetings: 3,
      },
      statsWindowDays: 30,
      equipePage: 1,
    });
    expect(essentiel.meneur?.competence).toBe(libellePointFort(SIGNATURE));
  });
});
