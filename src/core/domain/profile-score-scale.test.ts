import { describe, expect, it } from "@jest/globals";
import {
  discScoreScaleInstruction,
  PROFILE_SCORE_BANDS,
  PROFILE_SCORE_MAX,
  PROFILE_SCORE_UNPROVEN_MAX,
  soncasScoreScaleInstruction,
} from "./profile-score-scale";

describe("PROFILE_SCORE_BANDS", () => {
  /*
    Les deux schémas acceptent n'importe quel nombre de 0 à 100. Un trou entre
    deux tranches laisserait donc le modèle poser un score qu'aucune tranche ne
    décrit, et il le poserait : c'est exactement ce qu'il fait aujourd'hui,
    faute d'échelle. Ces trois tests tiennent la couverture, l'ordre et
    l'absence de chevauchement.
  */
  it("couvre 0 à 100 sans trou ni chevauchement", () => {
    expect(PROFILE_SCORE_BANDS.length).toBeGreaterThan(1);
    expect(PROFILE_SCORE_BANDS[0]?.min).toBe(0);
    expect(PROFILE_SCORE_BANDS.at(-1)?.max).toBe(PROFILE_SCORE_MAX);

    for (let i = 1; i < PROFILE_SCORE_BANDS.length; i += 1) {
      const avant = PROFILE_SCORE_BANDS[i - 1];
      const tranche = PROFILE_SCORE_BANDS[i];
      expect([i, tranche?.min]).toEqual([i, (avant?.max ?? -1) + 1]);
    }
  });

  it("ne contient aucune tranche vide ni inversée", () => {
    for (const tranche of PROFILE_SCORE_BANDS) {
      expect([tranche.nom, tranche.min <= tranche.max]).toEqual([
        tranche.nom,
        true,
      ]);
    }
  });

  it("nomme chaque tranche une seule fois", () => {
    const noms = PROFILE_SCORE_BANDS.map((tranche) => tranche.nom);
    expect(new Set(noms).size).toBe(noms.length);
  });

  /*
    Le seuil du verbatim obligatoire est la borne haute de la première tranche,
    et pas un nombre choisi à côté. `soncas-evidence-rule.ts` y ramène les
    leviers sans preuve : s'il tombait au milieu d'une tranche, un levier
    corrigé ressortirait dans une tranche dont il ne remplit pas la condition.
  */
  it("aligne le seuil du verbatim sur la fin de la premiere tranche", () => {
    expect(PROFILE_SCORE_BANDS[0]?.max).toBe(PROFILE_SCORE_UNPROVEN_MAX);
  });

  /*
    La première tranche doit couvrir le trait absent comme le trait
    invérifiable. Sa condition dit les deux, et ce test tient la seconde
    moitié : c'est elle qui justifie qu'on y renvoie un score sans preuve
    plutôt que de le mettre à zéro.
  */
  it("laisse la premiere tranche accueillir ce qu on ne peut pas citer", () => {
    expect(PROFILE_SCORE_BANDS[0]?.condition).toContain("quote");
  });
});

/*
  Les deux consignes se fabriquent depuis les mêmes tranches. Ces tests lisent
  `PROFILE_SCORE_BANDS` plutôt qu'une liste recopiée : une tranche ajoutée
  demain et oubliée dans le texte tomberait ici.
*/
describe("les deux consignes de calibration", () => {
  const consignes = {
    SONCAS: soncasScoreScaleInstruction(),
    DISC: discScoreScaleInstruction(),
  };

  it("affichent chaque tranche, ses bornes et sa condition", () => {
    for (const [cadre, consigne] of Object.entries(consignes)) {
      for (const tranche of PROFILE_SCORE_BANDS) {
        expect([cadre, tranche.nom, consigne]).toEqual([
          cadre,
          tranche.nom,
          expect.stringContaining(
            `${tranche.min}–${tranche.max} ${tranche.nom}: ${tranche.condition}`,
          ),
        ]);
      }
    }
  });

  /*
    Une puce par tranche, chacune sur sa ligne. Les cinq collées en un
    paragraphe restent lisibles pour nous et cessent de l'être pour le modèle :
    il reçoit une phrase où cinq bornes se suivent, au lieu d'une liste où
    chacune se retrouve.
  */
  it("posent une puce par tranche, chacune sur sa ligne", () => {
    for (const [cadre, consigne] of Object.entries(consignes)) {
      for (const tranche of PROFILE_SCORE_BANDS) {
        expect([cadre, tranche.nom, consigne]).toEqual([
          cadre,
          tranche.nom,
          expect.stringContaining(`\n- ${tranche.min}–${tranche.max} `),
        ]);
      }
    }
  });

  /*
    « En cas de doute, prends la tranche du dessous » est la règle qui fait
    baisser la moyenne des notes molles. Sans elle, une échelle décrite ne
    change presque rien : le modèle hésite vers le haut.
  */
  it("demandent de trancher vers le bas", () => {
    for (const [cadre, consigne] of Object.entries(consignes)) {
      expect([cadre, consigne]).toEqual([
        cadre,
        expect.stringContaining("take the lower one"),
      ]);
    }
  });

  /*
    Le seuil est cité dans le texte, et il vient de la constante. Un nombre
    recopié à la main dans la phrase et laissé derrière le jour où la constante
    bouge donnerait une consigne qui annonce un seuil pendant que le produit en
    applique un autre : le modèle placerait ses leviers à une borne, et le
    produit les ramènerait à une autre.
  */
  it("annoncent le seuil en dessous duquel une note se passe de preuve", () => {
    for (const [cadre, consigne] of Object.entries(consignes)) {
      expect([cadre, consigne]).toEqual([
        cadre,
        expect.stringContaining(`above ${PROFILE_SCORE_UNPROVEN_MAX}`),
      ]);
    }
  });

  /*
    L'intervalle est annoncé dans le titre, où le modèle le lit avant tout le
    reste. Le vérifier avec sa parenthèse et son « calibrated » n'est pas une
    coquetterie : « 0–100 » tout court se retrouve aussi dans la dernière
    tranche, « 80–100 pervasive », et un titre qui annoncerait une autre borne
    que celle du schéma passerait au travers du test sans qu'on le voie.
  */
  it("annoncent la note maximale que le schema accepte", () => {
    for (const [cadre, consigne] of Object.entries(consignes)) {
      expect([cadre, consigne]).toEqual([
        cadre,
        expect.stringContaining(`(0–${PROFILE_SCORE_MAX}, calibrated)`),
      ]);
    }
  });

  /*
    Le trait noté est celui du prospect. Un modèle qui reçoit un compte rendu où
    le commercial parle d'argent pendant une heure attribue volontiers le levier
    Argent au prospect, qui n'en a rien dit.
  */
  it("rappellent que la note porte sur le prospect", () => {
    for (const [cadre, consigne] of Object.entries(consignes)) {
      expect([cadre, consigne]).toEqual([
        cadre,
        expect.stringContaining("never the seller"),
      ]);
    }
  });

  it("n emploient aucun tiret cadratin", () => {
    for (const [cadre, consigne] of Object.entries(consignes)) {
      expect([cadre, consigne.includes("—")]).toEqual([cadre, false]);
    }
  });

  /*
    Ni l'un ni l'autre ne produit les champs de KISS. Leur en parler
    apprendrait à un modèle qui note les motivations d'un prospect que ses
    chiffres sont une performance de vendeur.
  */
  it("ne parlent d aucun champ qui appartient a KISS", () => {
    for (const [cadre, consigne] of Object.entries(consignes)) {
      expect([cadre, consigne.includes("sellerSkills")]).toEqual([
        cadre,
        false,
      ]);
      expect([cadre, consigne.includes("coachingScore")]).toEqual([
        cadre,
        false,
      ]);
    }
  });
});

describe("soncasScoreScaleInstruction", () => {
  it("range les preuves dans le champ evidence du levier note", () => {
    const consigne = soncasScoreScaleInstruction();
    expect(consigne).toContain("that driver's `evidence`");
  });

  /*
    Le modèle a le droit de savoir ce qu'on fait de ses nombres. La moyenne des
    six leviers devient le SalesScore du rendez-vous, puis la moyenne du
    commercial, puis sa place au classement : six notes posées au jugé ne
    restent pas dans la fiche du rendez-vous.
  */
  it("dit que le produit fait la moyenne des six leviers", () => {
    expect(soncasScoreScaleInstruction()).toContain("averages them");
  });

  /*
    Le produit corrige un levier annoncé haut sans preuve, et la consigne
    l'annonce. Un modèle prévenu qu'un raccourci sera défait n'a plus de raison
    de le prendre ; l'inverse, une correction silencieuse, laisserait le modèle
    produire des 80 vides à chaque analyse.
  */
  it("prévient que le produit ramène un levier sans preuve", () => {
    expect(soncasScoreScaleInstruction()).toContain("puts it back there");
  });
});

describe("discScoreScaleInstruction", () => {
  /*
    DISC est souvent enseigné comme un partage de cent points entre quatre
    styles. Le schéma, lui, porte quatre notes de 0 à 100 indépendantes : un
    modèle qui applique la règle apprise rendrait quatre notes autour de 25 pour
    un prospect dont un style crève l'écran.
  */
  it("dit que les quatre styles ne se partagent pas cent points", () => {
    expect(discScoreScaleInstruction()).toContain("do not share a hundred");
  });

  /*
    DISC porte une seule liste `evidence` pour ses quatre styles. Aucune règle
    produit ne peut donc y rattacher une preuve à une note en particulier, et la
    consigne doit demander elle-même de nommer le style que chaque preuve
    appuie.
  */
  it("demande des preuves rattachables a un style", () => {
    const consigne = discScoreScaleInstruction();
    expect(consigne).toContain("traceable");
    expect(consigne).toContain("which score it supports");
  });

  /*
    Le paragraphe de SONCAS sur la correction du produit n'a pas d'équivalent
    ici, et ce test tient l'absence : le recopier promettrait à DISC une règle
    qui ne tourne pas, et un modèle prévenu qu'on le rattrapera se relit moins.
  */
  it("ne promet aucune correction que le produit ne fait pas", () => {
    expect(discScoreScaleInstruction()).not.toContain("puts it back there");
  });
});
