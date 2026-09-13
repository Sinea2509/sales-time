import { describe, expect, it } from "@jest/globals";
import { matriceRendezVousLegende } from "./matrice-rendez-vous-legende";

describe("matriceRendezVousLegende", () => {
  it("says nothing was measured rather than showing a zero", () => {
    expect(
      matriceRendezVousLegende({ pointsPlaces: 0, rdvSurLaPeriode: 0 }),
    ).toBe("Aucun rendez-vous sur la période.");
  });

  /*
    Le cas qui a motivé la fonction : le lecteur compte les points, la légende
    annonce un autre nombre. Les deux nombres de la phrase doivent toujours
    s'additionner pour retomber sur le total de la période.
  */
  it("adds up: placed plus discarded equals the period total", () => {
    const phrase = matriceRendezVousLegende({
      pointsPlaces: 9,
      rdvSurLaPeriode: 20,
    });
    expect(phrase).toContain("9 RDV placés sur les 20 de la période.");
    expect(phrase).toContain("11 écartés");
  });

  it("keeps the French plural at two, not at one", () => {
    expect(
      matriceRendezVousLegende({ pointsPlaces: 1, rdvSurLaPeriode: 3 }),
    ).toBe(
      "1 RDV placé sur les 3 de la période. 2 écartés, faute de note de qualification ou de montant potentiel.",
    );
    expect(
      matriceRendezVousLegende({ pointsPlaces: 2, rdvSurLaPeriode: 3 }),
    ).toBe(
      "2 RDV placés sur les 3 de la période. 1 écarté, faute de note de qualification ou de montant potentiel.",
    );
  });

  it("does not mention discarded meetings when there are none", () => {
    expect(
      matriceRendezVousLegende({ pointsPlaces: 5, rdvSurLaPeriode: 5 }),
    ).toBe("Les 5 RDV de la période.");
    expect(
      matriceRendezVousLegende({ pointsPlaces: 1, rdvSurLaPeriode: 1 }),
    ).toBe("Le seul RDV de la période.");
  });

  it("explains an empty chart instead of leaving bare axes unexplained", () => {
    expect(
      matriceRendezVousLegende({ pointsPlaces: 0, rdvSurLaPeriode: 8 }),
    ).toBe(
      "Aucun des 8 RDV de la période n'a à la fois une note de qualification et un montant potentiel.",
    );
    expect(
      matriceRendezVousLegende({ pointsPlaces: 0, rdvSurLaPeriode: 1 }),
    ).toBe(
      "Le rendez-vous de la période n'a pas de note de qualification ou pas de montant potentiel.",
    );
  });

  /*
    « RDV » est un sigle : il ne prend pas la marque du pluriel. La faute était
    présente dans la légende d'origine (« sur 12 rdvs »).
  */
  it("never writes the acronym in the plural", () => {
    for (let total = 0; total <= 12; total += 1) {
      for (let placed = 0; placed <= total; placed += 1) {
        const phrase = matriceRendezVousLegende({
          pointsPlaces: placed,
          rdvSurLaPeriode: total,
        });
        expect(phrase).not.toMatch(/RDVs/);
        expect(phrase).not.toMatch(/rdvs/i);
      }
    }
  });

  it("never leaves a bare number right after sur", () => {
    for (let total = 1; total <= 12; total += 1) {
      for (let placed = 0; placed <= total; placed += 1) {
        const phrase = matriceRendezVousLegende({
          pointsPlaces: placed,
          rdvSurLaPeriode: total,
        });
        expect(phrase).not.toMatch(/\bsur \d/);
      }
    }
  });
});
