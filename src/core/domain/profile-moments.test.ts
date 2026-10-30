import { describe, expect, it } from "@jest/globals";
import {
  discFromMoments,
  profileScoreFromPoints,
  soncasFromMoments,
} from "./profile-moments";

const CONSEILS = { whatItMeans: "S.", howToTalk: "T.", whatToAvoid: "E." };
const PROSPECT = [
  "On veut essayer autre chose que ce qu'on fait depuis des années.",
  "On n'a jamais fait ces prix-là.",
  "Il faut que les collaborateurs se sentent écoutés.",
].join("\n");

function moment(
  words: string,
  levers: {
    lever: "nouveaute" | "argent" | "sympathie" | "securite";
    strength: "nette" | "faible";
  }[],
) {
  return {
    moment: "",
    topic: "attentes" as const,
    sellerQuestion: "",
    prospectWords: words,
    levers,
    reading: "R.",
  };
}

describe("profileScoreFromPoints", () => {
  it("place un passage net dans la tranche nette, deux dans la tranche marquée", () => {
    expect(profileScoreFromPoints(0)).toBe(10);
    expect(profileScoreFromPoints(1)).toBe(25);
    expect(profileScoreFromPoints(2)).toBe(45);
    expect(profileScoreFromPoints(4)).toBe(62);
    expect(profileScoreFromPoints(20)).toBe(95);
  });
});

describe("soncasFromMoments", () => {
  it("note les leviers sur leurs passages, et écarte un passage introuvable", () => {
    const out = soncasFromMoments(
      {
        moments: [
          moment(
            "On veut essayer autre chose que ce qu'on fait depuis des années.",
            [{ lever: "nouveaute", strength: "nette" }],
          ),
          moment("On n'a jamais fait ces prix-là.", [
            { lever: "argent", strength: "nette" },
            { lever: "securite", strength: "faible" },
          ]),
          moment("Il faut que les collaborateurs se sentent écoutés.", [
            { lever: "sympathie", strength: "nette" },
          ]),
          moment("Nous voulons une garantie écrite sur les résultats.", [
            { lever: "securite", strength: "nette" },
          ]),
        ],
        summary: "S.",
        mainLever: "nouveaute",
        actionableAdvice: CONSEILS,
      },
      PROSPECT,
    );
    expect(out.moments).toHaveLength(3);
    expect(out.drivers.nouveaute.score).toBe(45);
    expect(out.drivers.argent.score).toBe(45);
    expect(out.drivers.securite.score).toBe(25);
    expect(out.drivers.orgueil).toEqual({ score: 10, evidence: [] });
    // Égalité à 45 : le levier que le résumé nomme l'emporte.
    expect(out.dominant).toBe("nouveaute");
  });

  describe("le levier principal à égalité", () => {
    const egalite = {
      moments: [
        moment(
          "On veut essayer autre chose que ce qu'on fait depuis des années.",
          [{ lever: "nouveaute" as const, strength: "nette" as const }],
        ),
        moment("On n'a jamais fait ces prix-là.", [
          { lever: "argent" as const, strength: "nette" as const },
        ]),
      ],
      summary: "S.",
      actionableAdvice: CONSEILS,
    };

    it("suit le résumé, pour que la fiche ne se contredise pas", () => {
      const out = soncasFromMoments(
        { ...egalite, mainLever: "argent" },
        PROSPECT,
      );
      expect(out.drivers.nouveaute.score).toBe(out.drivers.argent.score);
      expect(out.dominant).toBe("argent");
    });

    it("ne suit pas un levier nommé qui n'est pas en tête", () => {
      const out = soncasFromMoments(
        { ...egalite, mainLever: "sympathie" },
        PROSPECT,
      );
      expect(out.dominant).toBe("nouveaute");
    });

    it("garde l'ancien départage sur une réponse d'avant ce champ", () => {
      const out = soncasFromMoments(egalite as never, PROSPECT);
      expect(out.dominant).toBe("nouveaute");
    });
  });

  it("ne compte un passage net qu'une fois, pour son premier levier net", () => {
    const out = soncasFromMoments(
      {
        moments: [
          moment("Il faut que les collaborateurs se sentent écoutés.", [
            { lever: "sympathie", strength: "nette" },
            { lever: "securite", strength: "nette" },
            { lever: "argent", strength: "faible" },
          ]),
        ],
        summary: "S.",
        mainLever: "sympathie",
        actionableAdvice: CONSEILS,
      },
      PROSPECT,
    );
    expect(out.drivers.sympathie.score).toBe(45);
    expect(out.drivers.securite.score).toBe(25);
    expect(out.drivers.argent.score).toBe(25);
    // La fiche affiche ce qui a compté.
    expect(out.moments[0]?.levers).toEqual([
      { lever: "sympathie", strength: "nette" },
      { lever: "securite", strength: "faible" },
      { lever: "argent", strength: "faible" },
    ]);
  });

  it("ne compte qu'une fois un levier répété dans un même passage, et un passage en double", () => {
    const words = "On n'a jamais fait ces prix-là.";
    const out = soncasFromMoments(
      {
        moments: [
          moment(words, [
            { lever: "argent", strength: "nette" },
            { lever: "argent", strength: "nette" },
          ]),
          moment(words, [{ lever: "argent", strength: "nette" }]),
        ],
        summary: "S.",
        mainLever: "argent",
        actionableAdvice: CONSEILS,
      },
      PROSPECT,
    );
    expect(out.drivers.argent.score).toBe(45);
  });
});

describe("discFromMoments", () => {
  it("note les styles sur leurs passages et garde la façon de dire", () => {
    const out = discFromMoments(
      {
        moments: [
          {
            moment: "12:05",
            situation: "reponse_a_une_question" as const,
            prospectWords: "Il faut que les collaborateurs se sentent écoutés.",
            behaviour: "Elle prend le temps, parle des personnes.",
            styles: [
              { style: "S" as const, strength: "nette" as const },
              { style: "I" as const, strength: "faible" as const },
            ],
          },
        ],
        summary: "S.",
        actionableAdvice: CONSEILS,
      },
      PROSPECT,
    );
    expect(out.scores).toEqual({ D: 10, I: 25, S: 45, C: 10 });
    expect(out.dominant).toBe("S");
    expect(out.evidence[0]).toContain("Stabilité");
  });
});

describe("le nettoyage des passages", () => {
  it("ne garde qu'un horodatage et une vraie question du commercial", () => {
    const out = soncasFromMoments(
      {
        moments: [
          {
            ...moment("On n'a jamais fait ces prix-là.", [
              { lever: "argent", strength: "nette" },
            ]),
            moment: "51:45",
            sellerQuestion: "Ces prix vous semblent jouables ?",
          },
          {
            ...moment("Il faut que les collaborateurs se sentent écoutés.", [
              { lever: "sympathie", strength: "nette" },
            ]),
            moment: "Elle parle de ses équipes",
            sellerQuestion: "Oui, en effet.",
          },
        ],
        summary: "S.",
        mainLever: "argent",
        actionableAdvice: CONSEILS,
      },
      PROSPECT,
      "Ces prix vous semblent jouables ?\nOui, en effet.",
    );
    expect(out.moments.map((m) => [m.moment, m.sellerQuestion])).toEqual([
      ["51:45", "Ces prix vous semblent jouables ?"],
      ["", ""],
    ]);
  });
});
