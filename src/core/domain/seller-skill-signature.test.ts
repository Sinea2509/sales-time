import { SALES_PROFILE_DIMENSION_KEYS } from "./sales-profile-from-meetings";
import type { SalesProfileScores } from "./sales-profile-from-meetings";
import {
  DISC_LABEL_FR,
  SONCAS_LABEL_FR,
} from "./seller-affinity-from-meetings";
import { RANKING_TIERS } from "./team-ranking";
import {
  averageSkillScores,
  formatEcartCompetence,
  SELLER_SKILL_LABEL_FR,
  SELLER_SKILL_SHORT_FR,
  sellerSkillSignature,
} from "./seller-skill-signature";

/** Minuscules, sans accents : « Écoute » et « ecoute » sont le même mot. */
function replie(mot: string): string {
  return mot
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");
}

function notes(partial: Partial<SalesProfileScores>): SalesProfileScores {
  return {
    assertivite: 50,
    ecouteActive: 50,
    capitalSympathie: 50,
    argumentation: 50,
    objections: 50,
    nextSteps: 50,
    ...partial,
  };
}

describe("SELLER_SKILL_LABEL_FR", () => {
  it("nomme les six dimensions, sans en oublier ni en inventer", () => {
    expect(Object.keys(SELLER_SKILL_LABEL_FR).sort()).toEqual(
      [...SALES_PROFILE_DIMENSION_KEYS].sort(),
    );
    expect(Object.keys(SELLER_SKILL_SHORT_FR).sort()).toEqual(
      [...SALES_PROFILE_DIMENSION_KEYS].sort(),
    );
  });

  it("n'emprunte aucun mot au vocabulaire qui décrit le prospect", () => {
    // La règle que ce test protège : sur une même ligne, un mot qui décrit
    // l'acheteur ne doit jamais pouvoir se lire comme un trait du vendeur. Le
    // mot est cherché à l'intérieur du libellé et pas seulement comme libellé
    // entier, parce que « Capital sympathie » posé à côté du levier SONCAS
    // « Sympathie » rejoue exactement la confusion.
    const interdits = [
      ...Object.values(SONCAS_LABEL_FR),
      ...Object.values(DISC_LABEL_FR),
      ...RANKING_TIERS.map((t) => t.nom),
    ].map(replie);

    for (const label of [
      ...Object.values(SELLER_SKILL_LABEL_FR),
      ...Object.values(SELLER_SKILL_SHORT_FR),
    ]) {
      for (const interdit of interdits) {
        expect(replie(label).includes(interdit)).toBe(false);
      }
    }
  });

  it("n'emprunte pas non plus le mot « étape », qui nomme l'étape de vente", () => {
    for (const label of [
      ...Object.values(SELLER_SKILL_LABEL_FR),
      ...Object.values(SELLER_SKILL_SHORT_FR),
    ]) {
      expect(replie(label)).not.toContain("etape");
    }
  });

  it("écrit les libellés en français, sans mot anglais", () => {
    for (const label of [
      ...Object.values(SELLER_SKILL_LABEL_FR),
      ...Object.values(SELLER_SKILL_SHORT_FR),
    ]) {
      expect(label).not.toMatch(/next step|steps/i);
    }
  });

  it("écrit les libellés courts en entier, sans abréviation à points", () => {
    // « Argument. » forçait le lecteur du radar à deviner la fin du mot.
    for (const label of Object.values(SELLER_SKILL_SHORT_FR)) {
      expect(label).not.toContain(".");
    }
  });
});

describe("averageSkillScores", () => {
  it("rend null quand la liste ne porte aucune note", () => {
    expect(averageSkillScores([])).toBeNull();
    expect(averageSkillScores([null, null])).toBeNull();
  });

  it("ignore les éléments sans note plutôt que de les compter zéro", () => {
    const moyenne = averageSkillScores([
      notes({ assertivite: 80 }),
      null,
      null,
    ]);
    expect(moyenne?.assertivite).toBe(80);
  });

  it("donne le même poids à chaque élément", () => {
    // C'est cette propriété qui rend le choix de l'appelant décisif : passer un
    // élément par commercial donne une voix par personne, passer un élément par
    // rendez-vous donnerait une voix par rendez-vous.
    const moyenne = averageSkillScores([
      notes({ objections: 90 }),
      notes({ objections: 30 }),
    ]);
    expect(moyenne?.objections).toBe(60);
  });

  it("moyenne chacune des six dimensions séparément", () => {
    const moyenne = averageSkillScores([
      notes({ assertivite: 20, nextSteps: 100 }),
      notes({ assertivite: 60, nextSteps: 60 }),
    ]);
    expect(moyenne?.assertivite).toBe(40);
    expect(moyenne?.nextSteps).toBe(80);
    expect(moyenne?.ecouteActive).toBe(50);
  });

  it("n'arrondit pas : l'arrondi appartient à l'écart, pas à la moyenne", () => {
    const moyenne = averageSkillScores([
      notes({ argumentation: 70 }),
      notes({ argumentation: 71 }),
    ]);
    expect(moyenne?.argumentation).toBe(70.5);
  });
});

describe("sellerSkillSignature", () => {
  const reference = notes({});

  it("nomme la compétence la plus haute et la plus basse face à l'équipe", () => {
    const signature = sellerSkillSignature(
      notes({ ecouteActive: 78, objections: 34 }),
      reference,
    );
    expect(signature).toEqual({
      fort: "ecouteActive",
      ecartFort: 28,
      faible: "objections",
      ecartFaible: -16,
    });
  });

  it("compare à l'équipe et non au niveau brut", () => {
    // Ce commercial est meilleur en argumentation (70) qu'en écoute (60) dans
    // l'absolu. Face à une équipe qui argumente à 85, c'est pourtant son point
    // faible : c'est l'écart qui distingue, pas le niveau.
    const signature = sellerSkillSignature(
      notes({ argumentation: 70, ecouteActive: 60 }),
      notes({ argumentation: 85, ecouteActive: 50 }),
    );
    expect(signature?.fort).toBe("ecouteActive");
    expect(signature?.faible).toBe("argumentation");
  });

  it("se tait quand le commercial est sa propre référence", () => {
    // Seul noté de son équipe : ses six écarts valent zéro. Lui désigner un
    // point fort inventerait une comparaison qui n'a pas eu lieu.
    const seul = notes({ assertivite: 91, objections: 12 });
    expect(sellerSkillSignature(seul, seul)).toBeNull();
  });

  it("se tait faute de notes, d'un côté comme de l'autre", () => {
    expect(sellerSkillSignature(null, reference)).toBeNull();
    expect(sellerSkillSignature(notes({}), null)).toBeNull();
  });

  it("tranche les écarts égaux par l'ordre fixe des dimensions", () => {
    // Deux dimensions à +20 et deux à −20 : c'est toujours la première de
    // l'ordre canonique qui est nommée, donc deux affichages de la même
    // période ne peuvent pas se contredire.
    const scores = notes({
      assertivite: 70,
      ecouteActive: 70,
      argumentation: 30,
      objections: 30,
    });
    const signature = sellerSkillSignature(scores, reference);
    expect(signature?.fort).toBe("assertivite");
    expect(signature?.faible).toBe("argumentation");
  });

  it("arrondit les écarts au point entier", () => {
    const signature = sellerSkillSignature(
      notes({ assertivite: 62.4 }),
      notes({ assertivite: 50.1 }),
    );
    expect(signature?.ecartFort).toBe(12);
  });
});

describe("formatEcartCompetence", () => {
  it("marque le sens de l'écart", () => {
    expect(formatEcartCompetence(7)).toBe("+7");
    expect(formatEcartCompetence(0)).toBe("0");
  });

  it("écrit le négatif avec un vrai signe moins, pas un trait d'union", () => {
    expect(formatEcartCompetence(-7)).toBe("−7");
    expect(formatEcartCompetence(-7)).not.toContain("-");
  });
});
