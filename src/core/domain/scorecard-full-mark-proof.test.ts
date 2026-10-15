import { describe, expect, it } from "@jest/globals";
import { levelScorecardObservations } from "./scorecard-coverage";
import { fullMarkProofMet } from "./scorecard-full-mark-proof";
import { DECOUVERTE_V2_GRID } from "./scorecard-grid";
import type { ScorecardProof } from "./scorecard-result-zod";

const prospect = (quote: string): ScorecardProof => ({
  who: "prospect",
  quote,
});
const seller = (quote: string): ScorecardProof => ({
  who: "commercial",
  quote,
});

describe("les preuves exigées pour 4 points", () => {
  it("l'effectif : un nombre de personnes, pas une durée", () => {
    expect(
      fullMarkProofMet("headcount", [
        prospect("On a une centaine de managers."),
      ]),
    ).toBe(true);
    expect(
      fullMarkProofMet("headcount", [
        prospect("On a deux formateurs internes."),
      ]),
    ).toBe(true);
    expect(
      fullMarkProofMet("headcount", [
        prospect("Nous sommes 300 dans le groupe."),
      ]),
    ).toBe(true);
    // Noz : le parcours de 43 heures n'est pas un effectif.
    expect(
      fullMarkProofMet("headcount", [
        prospect("Le parcours fait 43 heures découpé en modules."),
      ]),
    ).toBe(false);
    expect(
      fullMarkProofMet("headcount", [
        prospect("On est sur 1 000 euros par jour."),
      ]),
    ).toBe(false);
    // Le chiffre du commercial ne compte pas.
    expect(
      fullMarkProofMet("headcount", [seller("Vous avez 200 managers ?")]),
    ).toBe(false);
  });

  it("la date acceptée : un créneau, et l'accord du prospect", () => {
    expect(
      fullMarkProofMet("acceptedDate", [
        seller("Je vous propose mardi 4 novembre à 10 h ?"),
        prospect("Ça me va, je bloque le créneau."),
      ]),
    ).toBe(true);
    // Noz : des créneaux proposés, et le prospect qui préfère ne pas planifier.
    expect(
      fullMarkProofMet("acceptedDate", [
        seller("Je peux le 2 ou le 4 novembre."),
        prospect(
          "Ce que je vous propose, c'est qu'on planifie pas le rendez-vous maintenant, je vais voir avec elle.",
        ),
      ]),
    ).toBe(false);
  });

  it("le décideur nommé : qui décide, signe ou porte le budget", () => {
    expect(
      fullMarkProofMet("namedDecider", [
        prospect("C'est la DRH qui signe le budget formation."),
      ]),
    ).toBe(true);
    expect(
      fullMarkProofMet("namedDecider", [
        prospect("Au final c'est Sandrine qui décide."),
      ]),
    ).toBe(true);
    // Savoir à qui l'on soumet ne dit pas qui décide.
    expect(
      fullMarkProofMet("namedDecider", [
        prospect("Je dois le soumettre à Sandrine avant d'aller plus loin."),
      ]),
    ).toBe(false);
  });

  it("la raison de l'échec : ce qui a déçu, pas seulement des noms", () => {
    expect(
      fullMarkProofMet("failureReason", [
        prospect(
          "On a tenté des prestataires externes, et très déçus de la qualité de la prestation.",
        ),
      ]),
    ).toBe(true);
    expect(
      fullMarkProofMet("failureReason", [
        prospect("On a travaillé avec Cegos et Orsys."),
      ]),
    ).toBe(false);
  });
});

describe("le plafond à 3 sans la preuve", () => {
  const SELLER = "On se cale un moment pour vous présenter tout ça ?";
  const PROSPECT = "Je peux le 2 ou le 4 novembre, je vais voir avec elle.";
  const sources = {
    all: `${SELLER}\n${PROSPECT}`,
    seller: SELLER,
    prospect: PROSPECT,
  };

  it("arrête la prochaine étape à 3 sans date acceptée, et le dit", () => {
    const out = levelScorecardObservations(
      {
        criteria: [
          {
            key: "D1",
            explored: "creuse",
            obtained: "exploitable",
            learned: "Deux créneaux en novembre.",
            missing: "",
            observable: true,
            evidence: [
              { who: "commercial", quote: SELLER },
              { who: "prospect", quote: PROSPECT },
            ],
          },
        ],
        pointsLost: [],
        summary: "S",
      },
      DECOUVERTE_V2_GRID,
      sources,
    );
    expect(out.criteria[0]).toMatchObject({
      key: "D1",
      level: 3,
      capped: "aucune date acceptée par le prospect",
    });
  });
});
