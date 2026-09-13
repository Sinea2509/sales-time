import { describe, expect, it } from "@jest/globals";
import {
  COACHING_SCORE_MAX,
  POINTS_PAR_COACHING_SCORE,
  coachingScoreBands,
  coachingScoreScaleInstruction,
  libelleTranche,
} from "./coaching-score-scale";
import { kissGeneratedResultSchema } from "./kiss-result-zod";
import { RANKING_TIERS, tierFromSalesScore } from "./team-ranking";

const TIRET_CADRATIN = String.fromCodePoint(0x2014);

describe("coachingScoreBands", () => {
  it("suit l'échelle que le schéma impose au modèle", () => {
    /*
      La borne n'est pas un réglage : le schéma refuse tout ce qui sort de
      0 à 10. Une consigne qui décrirait une autre échelle ferait produire au
      modèle des notes que `safeParse` jetterait ensuite.
    */
    const champ = kissGeneratedResultSchema.shape.coachingScore;
    expect([champ.minValue, champ.maxValue]).toEqual([0, COACHING_SCORE_MAX]);
    expect(POINTS_PAR_COACHING_SCORE).toBe(10);
  });

  it("donne les tranches attendues pour les paliers du produit", () => {
    /*
      La correspondance écrite en clair, une seconde fois et à la main. Un
      palier déplacé doit se voir ici, pas seulement dans un calcul qui suivrait
      sans rien dire.
    */
    expect(coachingScoreBands().map((b) => [b.tier.id, b.min, b.max])).toEqual([
      ["demarrage", 0, 3],
      ["progression", 4, 5],
      ["maitrise", 6, 7],
      ["excellence", 8, 10],
    ]);
  });

  it("pave l'échelle entière, sans trou ni recouvrement", () => {
    const bands = coachingScoreBands();
    expect(bands[0]?.min).toBe(0);
    expect(bands[bands.length - 1]?.max).toBe(COACHING_SCORE_MAX);
    bands.forEach((band, i) => {
      expect([i, band.min <= band.max]).toEqual([i, true]);
      const precedent = bands[i - 1];
      if (precedent) expect([i, band.min]).toEqual([i, precedent.max + 1]);
    });
  });

  it("range chaque entier dans le palier que ce score atteint", () => {
    /*
      Le lien qui fait tenir toute la calibration : un `coachingScore` multiplié
      par dix doit tomber dans le palier annoncé, puisque c'est exactement ce
      que le produit en fait sur l'axe qualification de la matrice.
    */
    for (const band of coachingScoreBands()) {
      for (let note = band.min; note <= band.max; note += 1) {
        expect([
          note,
          tierFromSalesScore(note * POINTS_PAR_COACHING_SCORE)?.id,
        ]).toEqual([note, band.tier.id]);
      }
    }
  });

  it("nomme les paliers avec les mots affichés dans le produit", () => {
    const noms = coachingScoreBands().map((b) => b.tier.nom);
    for (const nom of noms) {
      expect(RANKING_TIERS.map((t) => t.nom)).toContain(nom);
    }
  });
});

describe("libelleTranche", () => {
  /*
    Aucun palier actuel ne tient dans un seul entier, donc la consigne livrée
    n'exerce jamais ce cas. Il n'est pas mort pour autant : il attend le premier
    palier plus étroit que dix points de SalesScore. Le tester ici, sur une
    tranche construite pour cela, évite qu'il parte à la dérive sans bruit.
  */
  const tier = RANKING_TIERS[0] as (typeof RANKING_TIERS)[number];

  it("condense une tranche d'un seul entier sur ce seul entier", () => {
    expect(libelleTranche({ tier, min: 7, max: 7 })).toBe("7");
  });

  it("donne ses deux bornes à une tranche qui en couvre plusieurs", () => {
    expect(libelleTranche({ tier, min: 0, max: 3 })).toBe("0–3");
  });

  it("emploie le même libellé que la consigne livrée", () => {
    const consigne = coachingScoreScaleInstruction();
    for (const band of coachingScoreBands()) {
      expect([band.tier.id, consigne]).toEqual([
        band.tier.id,
        expect.stringContaining(`- ${libelleTranche(band)}: `),
      ]);
    }
  });
});

describe("coachingScoreScaleInstruction", () => {
  it("écrit chaque tranche et le palier qui lui correspond", () => {
    const consigne = coachingScoreScaleInstruction();
    for (const band of coachingScoreBands()) {
      const tranche =
        band.min === band.max ? `${band.min}` : `${band.min}–${band.max}`;
      expect([band.tier.id, consigne]).toEqual([
        band.tier.id,
        expect.stringContaining(`- ${tranche}: ${band.tier.nom}`),
      ]);
    }
  });

  it("n'annonce aucune tranche que le classement démentirait", () => {
    /*
      Le défaut que cette échelle existe pour empêcher : une consigne figée qui
      continue d'annoncer d'anciennes bornes après un déplacement de palier. La
      consigne ne doit citer que les tranches réellement calculées.
    */
    const consigne = coachingScoreScaleInstruction();
    const tranchesDansLaConsigne = [
      ...consigne.matchAll(/^- (\S+): (.+)$/gm),
    ].map((m) => `${m[1]}:${m[2]}`);
    const tranchesVraies = coachingScoreBands().map((band) => {
      const tranche =
        band.min === band.max ? `${band.min}` : `${band.min}–${band.max}`;
      return `${tranche}:${band.tier.nom}`;
    });
    expect(tranchesDansLaConsigne).toEqual(tranchesVraies);
  });

  it("demande de trancher vers le bas et de citer le transcript", () => {
    /*
      Les deux règles qui font la différence entre une échelle et une
      décoration. Sans la première, un modèle hésitant monte toujours ; sans la
      seconde, il justifie la note qu'il a déjà choisie.
    */
    const consigne = coachingScoreScaleInstruction();
    expect(consigne).toContain("take the lower one");
    expect(consigne).toContain("quote or paraphrase");
  });

  it("n'emploie aucun tiret cadratin", () => {
    expect(coachingScoreScaleInstruction()).not.toContain(TIRET_CADRATIN);
  });
});
