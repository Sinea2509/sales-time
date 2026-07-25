import { describe, expect, it } from "@jest/globals";
import { formatPotentialEuro } from "./format-potential-euro";
import { VALEUR_NON_CALCULABLE } from "./valeur-non-calculable";

/**
 * `Intl` sépare les milliers par une espace fine insécable (U+202F) et la
 * devise par une espace insécable (U+00A0), et le choix entre les deux change
 * avec la version d'ICU. Les tests portent donc sur ce qui est promis, les
 * chiffres, la devise et l'absence de centimes, plutôt que sur le codet exact
 * de l'espace. `\s` couvre les deux, si bien qu'aucune de ces espaces n'a
 * besoin d'être recopiée dans le source, où elle serait invisible à la
 * relecture.
 */
function normaliserEspaces(value: string): string {
  return value.replace(/\s/g, " ");
}

describe("formatPotentialEuro", () => {
  it("dit que le montant manque au lieu de dessiner un tiret", () => {
    expect(formatPotentialEuro(null)).toBe(VALEUR_NON_CALCULABLE);
    expect(formatPotentialEuro(null)).not.toContain("-");
  });

  it("distingue un potentiel nul d'un potentiel absent", () => {
    // Zéro est une valeur mesurée, « n. c. » une valeur manquante : deux
    // situations qui n'appellent pas le même geste de la part du commercial.
    expect(normaliserEspaces(formatPotentialEuro(0))).toBe("0 €");
    expect(formatPotentialEuro(0)).not.toBe(VALEUR_NON_CALCULABLE);
  });

  it("groupe les milliers et coupe les centimes", () => {
    expect(normaliserEspaces(formatPotentialEuro(45000))).toBe("45 000 €");
    expect(normaliserEspaces(formatPotentialEuro(1234.56))).toBe("1 235 €");
  });

  it("garde les montants négatifs lisibles", () => {
    expect(normaliserEspaces(formatPotentialEuro(-1200))).toContain("1 200");
  });
});
