import { describe, expect, it } from "@jest/globals";
import {
  QUADRANTS_MATRICE,
  quadrantDeLaMatrice,
  type CoinDeMatrice,
} from "./matrice-quadrants";

describe("matrice-quadrants", () => {
  it("couvre les quatre coins, une fois chacun", () => {
    const coins = QUADRANTS_MATRICE.map((q) => q.coin);
    expect([...coins].sort()).toEqual([
      "bas-droite",
      "bas-gauche",
      "haut-droite",
      "haut-gauche",
    ]);
  });

  it("donne une clé distincte à chaque quadrant", () => {
    const identifiants = QUADRANTS_MATRICE.map((q) => q.cle);
    expect(new Set(identifiants).size).toBe(QUADRANTS_MATRICE.length);
  });

  it("place chaque signe dans le bon coin", () => {
    const attendu: Array<[number, number, CoinDeMatrice]> = [
      [2, 2, "haut-droite"],
      [-2, 2, "haut-gauche"],
      [2, -2, "bas-droite"],
      [-2, -2, "bas-gauche"],
    ];
    for (const [qualification, potential, coin] of attendu) {
      expect(quadrantDeLaMatrice({ qualification, potential })?.coin).toBe(
        coin,
      );
    }
  });

  it("ne range pas un point posé sur un axe", () => {
    // Abscisse zéro, c'est le SalesScore 50 : le cas est fréquent, pas théorique.
    expect(quadrantDeLaMatrice({ qualification: 0, potential: 2 })).toBeNull();
    expect(quadrantDeLaMatrice({ qualification: 2, potential: 0 })).toBeNull();
    expect(quadrantDeLaMatrice({ qualification: 0, potential: 0 })).toBeNull();
  });

  it("nomme une action et une raison pour chaque quadrant", () => {
    for (const q of QUADRANTS_MATRICE) {
      expect(q.action.length).toBeGreaterThan(0);
      // La raison cite les deux axes : une action sans son motif se lit comme
      // un ordre, et le lecteur ne peut pas vérifier qu'il est mérité.
      expect(q.raison.length).toBeGreaterThan(30);
    }
  });
});
