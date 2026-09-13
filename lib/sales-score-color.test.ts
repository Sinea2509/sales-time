import { describe, expect, it } from "@jest/globals";
import {
  POINTS_PAR_NOTE,
  RANKING_TIERS,
  type RankingTier,
  type RankingTierId,
} from "@/src/core/domain/team-ranking";
import { salesScoreBarClass, salesScoreColorClass } from "./sales-score-color";

/** Famille de couleur portée par une classe Tailwind, sans son intensité. */
function famille(classe: string): string | undefined {
  return ["red", "amber", "emerald"].find((f) => classe.includes(f));
}

/** Borne basse d'un palier, sur l'échelle 0 à 100 du SalesScore. */
function borneBasse(tier: RankingTier): number {
  return tier.minNoteOn5 * POINTS_PAR_NOTE;
}

/** Dernier score entier que le palier couvre encore. */
function borneHaute(tier: RankingTier): number {
  return tier.maxNoteOn5 == null ? 100 : tier.maxNoteOn5 * POINTS_PAR_NOTE - 1;
}

/**
 * La décision de couleur, écrite en clair plutôt que relue depuis le module.
 *
 * Un test qui recopierait la table du module ne vérifierait plus rien : il
 * bougerait avec elle. Ces quatre lignes sont donc la décision de conception,
 * posée une seconde fois et à la main, pour qu'un changement de couleur soit
 * toujours un changement volontaire.
 */
const FAMILLE_ATTENDUE: Readonly<Record<RankingTierId, string>> = {
  demarrage: "red",
  progression: "amber",
  maitrise: "emerald",
  excellence: "emerald",
};

describe("salesScoreColorClass", () => {
  it("peint chaque palier de la couleur décidée pour lui", () => {
    for (const tier of RANKING_TIERS) {
      for (const score of [borneBasse(tier), borneHaute(tier)]) {
        expect([tier.id, score, famille(salesScoreColorClass(score))]).toEqual([
          tier.id,
          score,
          FAMILLE_ATTENDUE[tier.id],
        ]);
      }
    }
  });

  it("ne change de couleur qu'à une borne de palier", () => {
    /*
      Le défaut corrigé ici. La couleur se décidait à 50 et 70 pendant que le
      classement plaçait ses paliers à 40, 60 et 80 : un rendez-vous à 65
      s'affichait en ambre, couleur de la vigilance, sur l'écran même où son
      commercial était rangé en « Maîtrise ». Aucune des deux frontières n'était
      annoncée au lecteur, qui voyait le produit se contredire.
    */
    const bornes = new Set(RANKING_TIERS.map(borneBasse));
    for (let score = 1; score <= 100; score += 1) {
      const change =
        famille(salesScoreColorClass(score)) !==
        famille(salesScoreColorClass(score - 1));
      if (change) {
        expect([score, bornes.has(score)]).toEqual([score, true]);
      }
    }
  });

  it("range un 65 du côté du palier qui le range", () => {
    expect(famille(salesScoreColorClass(65))).toBe("emerald");
  });

  it("ne redescend jamais de couleur quand le score monte", () => {
    /*
      Les trois familles vont de la plus inquiète à la plus rassurante. Un score
      plus haut ne peut donc pas rendre une couleur plus basse, quel que soit le
      découpage en paliers.
    */
    const rang = ["red", "amber", "emerald"];
    let precedent = 0;
    for (let score = 0; score <= 100; score += 1) {
      const actuel = rang.indexOf(famille(salesScoreColorClass(score)) ?? "");
      expect([score, actuel >= precedent]).toEqual([score, true]);
      precedent = actuel;
    }
  });

  it("retombe sur le premier palier devant un score impossible", () => {
    /*
      Ces valeurs ne sortent pas du modèle de données, où `salesScore` vaut un
      entier ou `null` que les appelants écartent. Rendre une classe vide
      effacerait pourtant le chiffre sur le papier de la charte, et rendre
      une couleur rassurante flatterait un nombre que personne ne pourrait
      justifier.
    */
    for (const score of [Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(famille(salesScoreColorClass(score))).toBe("red");
    }
    expect(famille(salesScoreColorClass(-5))).toBe("red");
    expect(famille(salesScoreColorClass(150))).toBe("emerald");
  });

  it("rend toujours une encre de texte, pour chaque palier", () => {
    for (const tier of RANKING_TIERS) {
      expect([tier.id, salesScoreColorClass(borneBasse(tier))]).toEqual([
        tier.id,
        expect.stringMatching(/^text-/),
      ]);
    }
  });
});

describe("salesScoreBarClass", () => {
  /*
    La barre doit dire la même chose que le chiffre posé à côté d'elle : le
    test parcourt l'échelle entière et compare la famille de couleur des deux
    classes, plutôt que de réécrire les seuils une seconde fois.
  */
  it("suit les mêmes paliers que la couleur du texte, sur toute l'échelle", () => {
    for (let score = 0; score <= 100; score += 1) {
      expect(famille(salesScoreBarClass(score))).toBe(
        famille(salesScoreColorClass(score)),
      );
    }
  });

  it("peint un remplissage, jamais une encre de texte", () => {
    const bornes = RANKING_TIERS.flatMap((tier) => [
      borneBasse(tier),
      borneHaute(tier),
    ]);
    for (const score of bornes) {
      expect(salesScoreBarClass(score)).toMatch(/^bg-/);
      expect(salesScoreBarClass(score)).not.toContain("text-");
    }
  });
});
