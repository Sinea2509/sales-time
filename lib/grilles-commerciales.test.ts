import { describe, expect, it } from "@jest/globals";
import {
  profilDeLaGrille,
  GRILLE_DISC,
  GRILLE_KISS,
  GRILLE_SONCAS,
} from "@/lib/grilles-commerciales";
import {
  DISC_HEX,
  SONCAS_HEX,
} from "@/src/core/domain/seller-affinity-from-meetings";

/**
 * Ces tests gardent deux choses. D'abord que chaque profil porte bien un geste
 * commercial et pas seulement une définition : un référentiel muet sur le
 * « comment s'adapter » ne servirait à rien au point d'usage. Ensuite que les
 * clés collent exactement à celles des barres et des camemberts : c'est par la
 * clé que le composant retrouve l'explication d'un « Influent » ou d'une
 * « Sécurité », et une clé qui dérive ferait taire la bulle sans rien casser.
 */

describe("référentiels DISC et SONCAS", () => {
  it("couvre les mêmes profils que les couleurs, aux mêmes clés", () => {
    expect(GRILLE_DISC.profils.map((p) => p.code).sort()).toEqual(
      Object.keys(DISC_HEX).sort(),
    );
    expect(GRILLE_SONCAS.profils.map((p) => p.code).sort()).toEqual(
      Object.keys(SONCAS_HEX).sort(),
    );
  });

  it("donne à chaque profil un nom, un résumé et un geste de rendez-vous", () => {
    for (const ref of [GRILLE_DISC, GRILLE_SONCAS]) {
      for (const p of ref.profils) {
        expect(p.nom.length).toBeGreaterThan(2);
        expect(p.resume.length).toBeGreaterThan(20);
        expect(p.enRendezVous.length).toBeGreaterThan(20);
      }
    }
  });

  it("épelle SONCAS avec ses six lettres, dans l'ordre", () => {
    expect(GRILLE_SONCAS.profils.map((p) => p.lettre).join("")).toBe("SONCAS");
    expect(GRILLE_DISC.profils.map((p) => p.lettre).join("")).toBe("DISC");
  });

  it("retrouve un profil par sa clé et se tait sur une clé inconnue", () => {
    expect(profilDeLaGrille(GRILLE_DISC, "D")?.nom).toBe("Dominant");
    expect(profilDeLaGrille(GRILLE_SONCAS, "argent")?.nom).toBe("Argent");
    expect(profilDeLaGrille(GRILLE_DISC, "Z")).toBeNull();
  });
});

describe("référentiel KISS", () => {
  it("décrit les quatre gestes, un résumé par colonne", () => {
    expect(GRILLE_KISS.quadrants.map((q) => q.cle)).toEqual([
      "keep",
      "improve",
      "start",
      "stop",
    ]);
    for (const q of GRILLE_KISS.quadrants) {
      expect(q.resume.length).toBeGreaterThan(15);
    }
  });
});
