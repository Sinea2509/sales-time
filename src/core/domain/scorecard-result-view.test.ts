import { describe, expect, it } from "@jest/globals";
import { DECOUVERTE_GRID } from "./scorecard-grid";
import type { ScorecardAnalysisResult } from "./scorecard-result-zod";
import { scorecardResultView } from "./scorecard-result-view";

/**
 * Une ligne d'analyse telle qu'elle a été enregistrée, dont chaque test ne
 * décrit que la partie qui l'intéresse. Les valeurs par défaut ne sont pas
 * cohérentes entre elles, et c'est voulu : un test qui compte sur une
 * cohérence qu'il n'a pas écrite vérifie le décor.
 */
function resultatEnBase(
  partiel: Partial<ScorecardAnalysisResult> = {},
): ScorecardAnalysisResult {
  return {
    gridId: DECOUVERTE_GRID.id,
    gridName: DECOUVERTE_GRID.name,
    overallScore: 50,
    blocks: DECOUVERTE_GRID.blocks.map((block) => ({
      key: block.key,
      name: block.name,
      score: 0,
      max: block.weight,
    })),
    criteria: [],
    pointsLost: [],
    keep: [],
    improve: [],
    stop: [],
    goldenQuestion: "Q",
    challenge: "C",
    summary: "S",
    ...partiel,
  };
}

describe("scorecardResultView", () => {
  /*
    Le test qui justifie l'existence de `gridId` dans la ligne enregistrée. Les
    niveaux donnés ici valent 4 partout, soit le maximum du bloc A ; le score
    enregistré vaut 7. C'est celui-là que la fiche doit montrer, parce que c'est
    celui qui a été calculé le jour de l'analyse et celui qui pèse dans le
    classement du commercial.
  */
  it("affiche les scores enregistrés, sans les recalculer", () => {
    const vue = scorecardResultView(
      resultatEnBase({
        overallScore: 7,
        blocks: [{ key: "A", name: "Contexte et compte", score: 7, max: 20 }],
        criteria: DECOUVERTE_GRID.blocks[0]!.criteria.map((criterion) => ({
          key: criterion.key,
          level: 4,
          evidence: [],
        })),
      }),
    );

    expect(vue.overallScore).toBe(7);
    expect(vue.blocks.map((b) => [b.key, b.score, b.max])).toEqual([
      ["A", 7, 20],
    ]);
  });

  it("range les critères dans l'ordre de la grille, pas dans celui du modèle", () => {
    const blocA = DECOUVERTE_GRID.blocks[0]!;
    const vue = scorecardResultView(
      resultatEnBase({
        blocks: [{ key: "A", name: blocA.name, score: 0, max: blocA.weight }],
        criteria: [...blocA.criteria].reverse().map((criterion) => ({
          key: criterion.key,
          level: 1,
          evidence: [],
        })),
      }),
    );

    expect(vue.blocks[0]!.criteria.map((c) => [c.key, c.label])).toEqual(
      blocA.criteria.map((c) => [c.key, c.label]),
    );
  });

  /*
    Omettre un critère est la façon la plus courante de ne pas avoir de preuve,
    et le calcul le compte déjà pour 0. La fiche doit dire la même chose que le
    calcul : un critère absent de la réponse se lit « 0, aucune preuve », et non
    « pas évalué », qui laisserait croire à une note en attente.
  */
  it("montre un critère omis au niveau 0, sans preuve", () => {
    const blocA = DECOUVERTE_GRID.blocks[0]!;
    const vue = scorecardResultView(
      resultatEnBase({
        blocks: [{ key: "A", name: blocA.name, score: 0, max: blocA.weight }],
        criteria: [{ key: "A1", level: 3, evidence: ["dit en RDV"] }],
      }),
    );

    const rendus = vue.blocks[0]!.criteria;
    expect(rendus).toHaveLength(blocA.criteria.length);
    expect([rendus[0]!.level, rendus[0]!.evidence]).toEqual([
      3,
      ["dit en RDV"],
    ]);
    expect([rendus[1]!.level, rendus[1]!.evidence]).toEqual([0, []]);
  });

  /*
    Une clé que la grille ne porte pas n'a rapporté aucun point : le calcul
    l'ignore faute de savoir à quel bloc l'ajouter. L'afficher quand même
    montrerait un niveau dont rien dans le total ne vient, et le commercial
    additionnerait des niveaux qui ne mènent pas à son score.
  */
  it("laisse de côté une clé inconnue de la grille", () => {
    const blocA = DECOUVERTE_GRID.blocks[0]!;
    const vue = scorecardResultView(
      resultatEnBase({
        blocks: [{ key: "A", name: blocA.name, score: 0, max: blocA.weight }],
        criteria: [{ key: "Z9", level: 4, evidence: ["hors grille"] }],
      }),
    );

    expect(vue.blocks[0]!.criteria.map((c) => c.key)).not.toContain("Z9");
  });

  /*
    Doublon : le score retient le niveau le plus bas, et la fiche doit montrer
    la preuve de celui-là. Une citation de niveau 3 affichée sous un niveau de 1
    obligerait le commercial à choisir entre les deux, sans rien pour choisir.
  */
  it("montre la preuve du niveau qui a compté, pas la plus flatteuse", () => {
    const blocA = DECOUVERTE_GRID.blocks[0]!;
    const vue = scorecardResultView(
      resultatEnBase({
        blocks: [{ key: "A", name: blocA.name, score: 0, max: blocA.weight }],
        criteria: [
          { key: "A1", level: 3, evidence: ["la citation généreuse"] },
          { key: "A1", level: 1, evidence: ["la citation retenue"] },
        ],
      }),
    );

    const premier = vue.blocks[0]!.criteria[0]!;
    expect([premier.level, premier.evidence]).toEqual([
      1,
      ["la citation retenue"],
    ]);
  });

  /*
    Deux fois le même niveau, deux citations différentes : le score ne tranche
    pas, il ne voit qu'un niveau. La fiche, elle, doit trancher, et toujours de
    la même façon. Sans règle, deux lectures de la même ligne montreraient deux
    citations, au gré de l'ordre où le modèle a écrit ses lignes.
  */
  it("garde la première citation quand deux entrées portent le même niveau", () => {
    const blocA = DECOUVERTE_GRID.blocks[0]!;
    const vue = scorecardResultView(
      resultatEnBase({
        blocks: [{ key: "A", name: blocA.name, score: 0, max: blocA.weight }],
        criteria: [
          { key: "A1", level: 2, evidence: ["la première citation"] },
          { key: "A1", level: 2, evidence: ["la seconde citation"] },
        ],
      }),
    );

    expect(vue.blocks[0]!.criteria[0]!.evidence).toEqual([
      "la première citation",
    ]);
  });

  /*
    « a1 » désigne le même critère que « A1 ». Le calcul le sait déjà ; si la
    fiche l'ignorait, elle afficherait un 0 sous un score qui compte un 4.
  */
  it("reconnaît une clé rendue en minuscules", () => {
    const blocA = DECOUVERTE_GRID.blocks[0]!;
    const vue = scorecardResultView(
      resultatEnBase({
        blocks: [{ key: "A", name: blocA.name, score: 0, max: blocA.weight }],
        criteria: [{ key: " a1 ", level: 4, evidence: ["oui"] }],
      }),
    );

    const premier = vue.blocks[0]!.criteria[0]!;
    expect([premier.level, premier.evidence]).toEqual([4, ["oui"]]);
  });

  /*
    La clé du bloc se lit comme celle du critère, à la casse près. Les deux
    viennent de la même ligne enregistrée, et la ligne est du JSON relu par un
    schéma qui ne touche à personne : rien ne garantit la casse d'une ligne
    écrite par une version plus ancienne. Tolérer la clé du critère et refuser
    celle du bloc ferait disparaître le détail d'un bloc dont le score
    s'affiche, et la fiche paraîtrait à moitié chargée.
  */
  it("reconnaît une clé de bloc rendue en minuscules", () => {
    const blocA = DECOUVERTE_GRID.blocks[0]!;
    const vue = scorecardResultView(
      resultatEnBase({
        blocks: [{ key: "a", name: blocA.name, score: 0, max: blocA.weight }],
        criteria: [{ key: "A1", level: 4, evidence: ["oui"] }],
      }),
    );

    expect(vue.blocks[0]!.criteria).toHaveLength(blocA.criteria.length);
    expect(vue.blocks[0]!.criteria[0]!.level).toBe(4);
  });

  /*
    Une grille retirée du produit ne doit pas emporter la note avec elle. Une
    analyse vieille de six mois garde son score, ses blocs et ses points perdus ;
    elle perd les intitulés, faute d'un endroit d'où les lire, et les clés
    s'affichent telles quelles.
  */
  it("garde la note quand la grille employée n'existe plus", () => {
    const vue = scorecardResultView(
      resultatEnBase({
        gridId: "GRILLE_DISPARUE",
        gridName: "Grille disparue",
        overallScore: 64,
        blocks: [{ key: "A", name: "Contexte et compte", score: 12, max: 20 }],
        criteria: [{ key: "A1", level: 4, evidence: ["oui"] }],
        pointsLost: [
          {
            key: "A1",
            evidence: "rien de chiffré",
            whatToSayInstead: "Combien ?",
          },
        ],
      }),
    );

    expect([vue.overallScore, vue.gridName]).toEqual([64, "Grille disparue"]);
    expect(vue.blocks[0]!.score).toBe(12);
    expect(vue.blocks[0]!.criteria).toEqual([]);
    expect(vue.pointsLost[0]!.label).toBe("A1");
  });

  it("traduit la clé d'un point perdu par son intitulé", () => {
    const vue = scorecardResultView(
      resultatEnBase({
        pointsLost: [
          {
            key: "b3",
            evidence: "aucun coût cité",
            whatToSayInstead: "Combien ?",
          },
        ],
      }),
    );

    expect(vue.pointsLost).toEqual([
      {
        key: "B3",
        label: "Impact et coût de l'inaction",
        evidence: "aucun coût cité",
        whatToSayInstead: "Combien ?",
      },
    ]);
  });

  /*
    Les deux sens de l'arrondi sont écrits, et pas seulement le plus commode.
    11 sur 32 tombe à 34,4 et descend, 13 sur 32 monte à 40,6 et remonte : avec
    la seule valeur descendante, une troncature passerait pour un arrondi et une
    jauge sur deux serait plus courte que la part qu'elle montre.
  */
  it("exprime chaque bloc en pourcentage entier de son maximum", () => {
    const vue = scorecardResultView(
      resultatEnBase({
        blocks: [
          { key: "A", name: "A", score: 10, max: 20 },
          { key: "B", name: "B", score: 11, max: 32 },
          { key: "C", name: "C", score: 24, max: 24 },
          { key: "D", name: "D", score: 13, max: 32 },
        ],
      }),
    );

    expect(vue.blocks.map((b) => b.percent)).toEqual([50, 34, 100, 41]);
  });

  /*
    Le schéma de lecture exige un maximum d'au moins 1, et aucune grille valide
    n'en porte d'autre. La fonction est pourtant exportée, et un appelant qui
    construirait ses blocs à la main obtiendrait une jauge large de l'infini
    plutôt qu'un écran vide.
  */
  it("rend 0 pour un bloc dont le maximum est nul", () => {
    const vue = scorecardResultView(
      resultatEnBase({ blocks: [{ key: "A", name: "A", score: 3, max: 0 }] }),
    );

    expect(vue.blocks[0]!.percent).toBe(0);
  });

  /*
    Le palier se lit sur le score global, sur l'échelle de 0 à 100 qui est celle
    de tout le produit. Le déduire d'une moyenne de blocs ou d'un pourcentage
    donnerait un second découpage du même nombre, et le même rendez-vous
    changerait de palier selon l'écran.
  */
  it("nomme le palier du score global", () => {
    expect(
      scorecardResultView(resultatEnBase({ overallScore: 39 })).tier?.id,
    ).toBe("demarrage");
    expect(
      scorecardResultView(resultatEnBase({ overallScore: 40 })).tier?.id,
    ).toBe("progression");
    expect(
      scorecardResultView(resultatEnBase({ overallScore: 60 })).tier?.id,
    ).toBe("maitrise");
    expect(
      scorecardResultView(resultatEnBase({ overallScore: 80 })).tier?.id,
    ).toBe("excellence");
  });

  it("recopie les trois textes que la fiche affiche telle quelle", () => {
    const vue = scorecardResultView(
      resultatEnBase({
        goldenQuestion: "Qui signe ?",
        challenge: "Poser la date en séance.",
        summary: "Un RDV mené proprement, sans décideur identifié.",
      }),
    );

    expect([vue.goldenQuestion, vue.challenge, vue.summary]).toEqual([
      "Qui signe ?",
      "Poser la date en séance.",
      "Un RDV mené proprement, sans décideur identifié.",
    ]);
  });
});
