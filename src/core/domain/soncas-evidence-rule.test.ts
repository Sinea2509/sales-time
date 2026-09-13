import { describe, expect, it } from "@jest/globals";
import {
  soncasResultSchema,
  type SoncasAnalysisResult,
} from "./analysis-result-zod";
import { PROFILE_SCORE_UNPROVEN_MAX } from "./profile-score-scale";
import { applySoncasEvidenceRule } from "./soncas-evidence-rule";

type Levier = { readonly score: number; readonly evidence: readonly string[] };

/**
 * Un résultat SONCAS complet, dont on ne surcharge que les leviers utiles.
 *
 * Les six leviers partent à 10 avec une preuve : sous le seuil et appuyés, ils
 * ne bougent donc jamais tant qu'un test ne les touche pas, et une note qui
 * change dans un test montre bien ce que ce test a fait.
 */
function resultatSoncas(
  leviers: Partial<Record<keyof SoncasAnalysisResult["drivers"], Levier>>,
  dominant: SoncasAnalysisResult["dominant"] = "securite",
): SoncasAnalysisResult {
  const plancher: Levier = { score: 10, evidence: ["on l a entendu"] };
  return soncasResultSchema.parse({
    drivers: {
      securite: plancher,
      orgueil: plancher,
      nouveaute: plancher,
      confort: plancher,
      argent: plancher,
      sympathie: plancher,
      ...leviers,
    },
    dominant,
    summary: "Compte rendu de test.",
  });
}

function notes(resultat: unknown): Record<string, number> {
  const parsed = soncasResultSchema.parse(resultat);
  return Object.fromEntries(
    Object.entries(parsed.drivers).map(([cle, levier]) => [cle, levier.score]),
  );
}

describe("applySoncasEvidenceRule", () => {
  it("ramène au seuil un levier noté haut sans aucune preuve", () => {
    const corrige = applySoncasEvidenceRule(
      resultatSoncas({ argent: { score: 85, evidence: [] } }),
    );
    expect(notes(corrige).argent).toBe(PROFILE_SCORE_UNPROVEN_MAX);
  });

  /*
    Ramené au seuil, pas à zéro. Ce que l'on sait, c'est que la preuve manque,
    pas que le levier est absent : l'écrire à zéro affirmerait plus que ce qui a
    été constaté, et zéro traverse ensuite la moyenne du rendez-vous.
  */
  it("ne met pas le levier a zero", () => {
    const corrige = applySoncasEvidenceRule(
      resultatSoncas({ argent: { score: 85, evidence: [] } }),
    );
    expect(notes(corrige).argent).toBeGreaterThan(0);
  });

  it("laisse intact un levier appuyé par une citation", () => {
    const corrige = applySoncasEvidenceRule(
      resultatSoncas({ argent: { score: 85, evidence: ["c est trop cher"] } }),
    );
    expect(notes(corrige).argent).toBe(85);
  });

  /*
    Un levier déjà dans la première tranche n'a rien à prouver : c'est la
    tranche où l'on range précisément ce qu'on ne peut pas citer. Le corriger
    quand même serait sans effet sur sa note, mais suffirait à faire croire à la
    fonction qu'elle a changé quelque chose, et le dominant serait recalculé
    pour rien.
  */
  it("laisse intact un levier bas et sans preuve", () => {
    const avant = resultatSoncas({
      argent: { score: PROFILE_SCORE_UNPROVEN_MAX, evidence: [] },
    });
    expect(applySoncasEvidenceRule(avant)).toBe(avant);
  });

  it("ramène le levier noté juste au dessus du seuil", () => {
    const corrige = applySoncasEvidenceRule(
      resultatSoncas({
        argent: { score: PROFILE_SCORE_UNPROVEN_MAX + 1, evidence: [] },
      }),
    );
    expect(notes(corrige).argent).toBe(PROFILE_SCORE_UNPROVEN_MAX);
  });

  /*
    Une liste de preuves qui ne contient que du blanc n'est pas une preuve. Le
    cas n'est pas théorique : un modèle sommé de citer et qui ne trouve rien
    remplit volontiers la liste d'une chaîne vide plutôt que de rendre une liste
    vide.
  */
  it("ne prend pas des espaces pour une citation", () => {
    const corrige = applySoncasEvidenceRule(
      resultatSoncas({ argent: { score: 85, evidence: ["", "   ", "\n\t"] } }),
    );
    expect(notes(corrige).argent).toBe(PROFILE_SCORE_UNPROVEN_MAX);
  });

  it("suffit d une seule citation non vide au milieu de blancs", () => {
    const corrige = applySoncasEvidenceRule(
      resultatSoncas({
        argent: { score: 85, evidence: ["  ", "c est trop cher", ""] },
      }),
    );
    expect(notes(corrige).argent).toBe(85);
  });

  it("corrige tous les leviers concernés, pas seulement le premier", () => {
    const corrige = applySoncasEvidenceRule(
      resultatSoncas({
        securite: { score: 70, evidence: [] },
        orgueil: { score: 60, evidence: [] },
        argent: { score: 90, evidence: [] },
      }),
    );
    expect(notes(corrige)).toEqual({
      securite: PROFILE_SCORE_UNPROVEN_MAX,
      orgueil: PROFILE_SCORE_UNPROVEN_MAX,
      nouveaute: 10,
      confort: 10,
      argent: PROFILE_SCORE_UNPROVEN_MAX,
      sympathie: 10,
    });
  });

  it("ne touche à aucun levier quand tous sont appuyés", () => {
    const avant = resultatSoncas({
      argent: { score: 90, evidence: ["c est trop cher"] },
    });
    expect(applySoncasEvidenceRule(avant)).toBe(avant);
  });

  /*
    Le dominant suit la note. Faute de le recalculer, la fiche annoncerait
    « dominant : Argent » au-dessus d'un Argent tombé à 19 pendant qu'un autre
    levier culmine à 70, et le commercial préparerait le rendez-vous suivant sur
    un levier que le produit venait de retirer.
  */
  it("recalcule le dominant quand celui ci vient d être ramené", () => {
    const corrige = applySoncasEvidenceRule(
      resultatSoncas(
        {
          argent: { score: 90, evidence: [] },
          confort: { score: 70, evidence: ["je veux que ca roule tout seul"] },
        },
        "argent",
      ),
    );
    expect(soncasResultSchema.parse(corrige).dominant).toBe("confort");
  });

  it("garde le dominant quand il reste le mieux note", () => {
    const corrige = applySoncasEvidenceRule(
      resultatSoncas(
        {
          confort: { score: 70, evidence: ["je veux que ca roule tout seul"] },
          argent: { score: 90, evidence: [] },
        },
        "confort",
      ),
    );
    expect(soncasResultSchema.parse(corrige).dominant).toBe("confort");
  });

  /*
    Deux leviers à la même note après correction : celui que le modèle avait
    désigné l'emporte. Le départage se fait sur une comparaison stricte, si bien
    qu'une égalité ne suffit pas à déplacer le dominant, et c'est voulu : rien ne
    permet de préférer l'un à l'autre, et le modèle a vu le compte rendu.

    Les deux sens sont vérifiés parce qu'une comparaison large ne se voit que
    dans un seul. Le parcours suit l'ordre de l'acronyme : un levier à égalité
    placé avant le dominant annoncé lui reprend la tête un instant, puis la lui
    rend quand son tour arrive, et l'erreur ne se lit plus dans le résultat. Seul
    un levier à égalité placé après le dominant annoncé la garde.
  */
  it("garde le dominant annoncé en cas d égalité, quel que soit l ordre", () => {
    const resultatApres = applySoncasEvidenceRule(
      resultatSoncas(
        {
          securite: { score: 60, evidence: ["il me faut des garanties"] },
          orgueil: { score: 90, evidence: [] },
          sympathie: { score: 60, evidence: ["on s entend bien"] },
        },
        "securite",
      ),
    );
    expect(soncasResultSchema.parse(resultatApres).dominant).toBe("securite");

    const resultatAvant = applySoncasEvidenceRule(
      resultatSoncas(
        {
          securite: { score: 60, evidence: ["il me faut des garanties"] },
          orgueil: { score: 90, evidence: [] },
          sympathie: { score: 60, evidence: ["on s entend bien"] },
        },
        "sympathie",
      ),
    );
    expect(soncasResultSchema.parse(resultatAvant).dominant).toBe("sympathie");
  });

  /*
    Le dominant n'est pas recalculé quand aucune note n'a bougé, même s'il
    n'était déjà pas le maximum. Une incohérence du modèle n'est pas une
    conséquence de cette règle, et la corriger ici donnerait à cette fonction un
    second métier que son nom ne dit pas.
  */
  it("ne corrige pas un dominant deja incoherent si rien ne bouge", () => {
    const avant = resultatSoncas(
      { argent: { score: 90, evidence: ["c est trop cher"] } },
      "sympathie",
    );
    const corrige = applySoncasEvidenceRule(avant);
    expect(corrige).toBe(avant);
    expect(soncasResultSchema.parse(corrige).dominant).toBe("sympathie");
  });

  it("garde le resume et les conseils du modèle", () => {
    const avant = soncasResultSchema.parse({
      ...resultatSoncas({ argent: { score: 90, evidence: [] } }),
      summary: "Un prospect qui compte.",
      actionableAdvice: {
        whatItMeans: "Il regarde le prix.",
        howToTalk: "Chiffrer tot.",
        whatToAvoid: "Noyer le prix dans une offre globale.",
      },
    });
    const corrige = soncasResultSchema.parse(applySoncasEvidenceRule(avant));
    expect(corrige.summary).toBe("Un prospect qui compte.");
    expect(corrige.actionableAdvice?.howToTalk).toBe("Chiffrer tot.");
  });

  /*
    La règle s'applique à l'écriture, et rien ne garantit qu'on lui passe un
    résultat SONCAS : un jour, un appelant l'appliquera au retour de DISC. Elle
    rend alors l'entrée telle quelle plutôt que de jeter, parce qu'une analyse
    payée au modèle ne doit pas être perdue par une règle de calibration.
  */
  it("rend l entree telle quelle quand ce n est pas un resultat SONCAS", () => {
    for (const entree of [
      null,
      undefined,
      42,
      "SONCAS",
      {},
      { scores: { D: 80, I: 20, S: 20, C: 20 }, dominant: "D" },
    ]) {
      expect(applySoncasEvidenceRule(entree)).toBe(entree);
    }
  });

  /*
    Les six leviers sont lus depuis le schéma, jamais recopiés. Ce test tient la
    promesse : un levier ajouté au schéma et oublié dans une liste recopiée
    passerait au travers de la règle sans que rien ne le signale.
  */
  it("couvre tous les leviers que le schema declare", () => {
    const declares = Object.keys(soncasResultSchema.shape.drivers.shape);
    const vides = Object.fromEntries(
      declares.map((cle) => [cle, { score: 90, evidence: [] }]),
    );
    const corrige = applySoncasEvidenceRule(
      soncasResultSchema.parse({
        drivers: vides,
        dominant: "securite",
        summary: "Tous sans preuve.",
      }),
    );
    for (const [cle, note] of Object.entries(notes(corrige))) {
      expect([cle, note]).toEqual([cle, PROFILE_SCORE_UNPROVEN_MAX]);
    }
  });
});
