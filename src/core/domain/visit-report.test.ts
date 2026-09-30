import { describe, expect, it } from "@jest/globals";
import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "./analysis-result-zod";
import type { ScorecardAnalysisResult } from "./scorecard-result-zod";
import {
  composeVisitReport,
  isCurrentVisitReport,
  isVisitReportHeading,
  shortPersonName,
  withMomentsFromTranscript,
  VISIT_REPORT_METHOD_NOTE,
  VISIT_REPORT_TITLE,
  visitReportWithoutSellerCoaching,
  type VisitReportInput,
} from "./visit-report";
import {
  visitReportExtractionSchema,
  type VisitReportExtraction,
} from "./visit-report-zod";

const extraction: VisitReportExtraction = {
  enUnePhrase:
    "Un rendez-vous de découverte solide sur le besoin, qui laisse le budget et le circuit de décision à préciser.",
  participants: {
    client: [
      {
        nom: "Claire Morel",
        role: "Directrice commerciale",
        statut: "présente, prescriptrice, non décisionnaire",
      },
    ],
    nous: [{ nom: "Julien Arnaud", role: "Commercial", statut: "présent" }],
    cites: [
      {
        nom: "Marc Vermont",
        role: "Directeur général",
        statut: "absent, décideur annoncé",
      },
    ],
  },
  origine: "",
  themes: [
    {
      titre: "Déclencheur et besoin exprimé",
      texte:
        "La marge brute recule de 34 % à 29 % en deux ans, faute de défendre le prix.",
      citations: [
        {
          qui: "Claire Morel",
          moment: "",
          texte: "Mes commerciaux accordent des remises trop vite.",
        },
        {
          qui: "Julien",
          moment: "",
          texte: "Qu'est-ce qui vous fait dire que c'est la remise ?",
        },
      ],
    },
    {
      titre: "",
      texte: "Un thème sans titre ne s'affiche pas.",
      citations: [],
    },
  ],
  perimetre: {
    texte: "Neuf commerciaux terrain sur quatre secteurs.",
    citations: [],
  },
  concurrence: { texte: "", citations: [] },
  objections: [
    {
      qui: "Claire Morel",
      moment: "",
      objection:
        "Mes commerciaux ne peuvent pas quitter le terrain trois jours.",
      reponse: "Le programme se découpe en demi-journées sur site.",
      effet: "L'objection est levée sur le principe.",
    },
  ],
  engagements: {
    texte: "",
    liste: ["Envoyer une proposition d'ici vendredi"],
    citations: [],
  },
  prochainRendezVous: {
    quand: "Le 7 octobre en fin de matinée",
    objectif: "Présenter la proposition au directeur général",
    participants: "Claire Morel, Marc Vermont, Julien Arnaud",
    aPreparer: "Trois chiffres et quinze minutes de présentation",
  },
  prochainesEtapes: [
    {
      action: "Envoyer le récapitulatif",
      echeance: "cet après-midi",
      porteur: "Julien Arnaud",
    },
  ],
};

const soncas: SoncasAnalysisResult = {
  drivers: {
    securite: { score: 55, evidence: ["plus personne n'appliquait rien"] },
    orgueil: { score: 10, evidence: [] },
    nouveaute: { score: 15, evidence: [] },
    confort: {
      score: 40,
      evidence: ["ne peuvent pas quitter le terrain trois jours"],
    },
    argent: {
      score: 72,
      evidence: ["Je veux voir la remise moyenne baisser."],
    },
    sympathie: { score: 12, evidence: [] },
  },
  dominant: "argent",
  summary: "Le levier principal est l'argent.",
};

const disc: DiscAnalysisResult = {
  scores: { D: 70, I: 20, S: 25, C: 60 },
  dominant: "D",
  evidence: ["Dominance : « je n'ai pas beaucoup de temps »"],
  summary: "Dans cet échange, la prospect va droit au but.",
  actionableAdvice: {
    whatItMeans: "Elle décide vite sur des faits.",
    howToTalk: "Nous vous suggérons d'aller droit aux chiffres.",
    whatToAvoid: "Il vaut mieux éviter les présentations longues.",
  },
};

const scorecard: ScorecardAnalysisResult = {
  gridId: "DECOUVERTE",
  gridName: "Rendez-vous de découverte",
  overallScore: 61,
  blocks: [
    { key: "A", name: "Contexte et compte", score: 14, max: 20 },
    { key: "B", name: "Besoin et douleur", score: 22, max: 32 },
    { key: "C", name: "Décision", score: 10, max: 24 },
    { key: "D", name: "Suite et engagement", score: 9, max: 12 },
    { key: "E", name: "Posture et exécution", score: 6, max: 12 },
  ],
  criteria: [
    { key: "B2", level: 4, evidence: ["ils ne savent pas défendre le prix"] },
    { key: "B3", level: 3, evidence: ["400 000 euros"] },
    { key: "B5", level: 2, evidence: [] },
    { key: "C1", level: 3, evidence: ["C'est lui qui signe"] },
    { key: "C3", level: 1, evidence: [] },
    { key: "C4", level: 2, evidence: [] },
    { key: "D1", level: 4, evidence: ["le 7 octobre"] },
  ],
  pointsLost: [
    {
      key: "C3",
      evidence: "Le budget est annoncé sans être discuté.",
      whatToSayInstead:
        "Pour vous proposer une solution à la bonne taille, j'ai besoin de situer votre budget : où vous situez-vous ?",
    },
  ],
  keep: ["La reformulation du besoin valide le problème avec le prospect."],
  improve: ["Le coût des nouveaux commerciaux reste à chiffrer."],
  stop: [],
  goldenQuestion:
    "Si rien ne change d'ici un an, qu'est-ce que cela vous coûte ?",
  challenge: "Poser une question de chiffrage avant de présenter le programme.",
  summary: "Un bon rendez-vous de découverte.",
};

function input(overrides: Partial<VisitReportInput> = {}): VisitReportInput {
  return {
    meeting: {
      prospectName: "Claire Morel",
      prospectCompany: "Menuiseries Vermont",
      meetingAt: new Date("2026-09-24T08:00:00Z"),
      meetingType: "Découverte",
      durationMin: 40,
      potentialAmount: 12600,
    },
    organizationName: "Acme Conseil",
    sellerName: "Julien Arnaud",
    history: [],
    extraction,
    soncas,
    disc,
    scorecard,
    ...overrides,
  };
}

describe("composeVisitReport", () => {
  it("suit l'ordre des rubriques validé le 2 septembre", () => {
    const text = composeVisitReport(input());
    const titles = text
      .split("\n")
      .filter((line, i, all) => isVisitReportHeading(line, all[i - 1]));
    expect(titles).toEqual([
      VISIT_REPORT_TITLE,
      "PARTICIPANTS",
      "HISTORIQUE DU COMPTE",
      "EN UNE PHRASE",
      "DÉCLENCHEUR ET BESOIN EXPRIMÉ",
      "PÉRIMÈTRE ET VOLUMÉTRIE",
      "OBJECTIONS ET RÉPONSES APPORTÉES",
      "PROFIL DE L'INTERLOCUTEUR",
      "MATURITÉ DE L'AFFAIRE",
      "ENGAGEMENTS PRIS PENDANT LE RENDEZ-VOUS",
      "PROCHAIN RENDEZ-VOUS",
      "PROCHAINES ÉTAPES",
      "CE QUI N'A PAS ÉTÉ COUVERT, ET LA QUESTION À POSER",
      "QUALITÉ DU RENDEZ-VOUS",
      "NOTE DE MÉTHODE",
    ]);
  });

  it("n'écrit ni déroulé horodaté, ni risques, ni mémoire du compte", () => {
    const text = composeVisitReport(input());
    expect(text).not.toMatch(/DÉROULÉ|RISQUES|MÉMOIRE DU COMPTE/);
  });

  it("écrit l'en-tête avec la date en toutes lettres et un montant sans espace insécable", () => {
    const lines = composeVisitReport(input()).split("\n");
    expect(lines[0]).toBe("COMPTE RENDU DE VISITE");
    expect(lines[1]).toBe(
      "Menuiseries Vermont · 24 septembre 2026 · Découverte · 40 min",
    );
    expect(lines[2]).toBe("Potentiel estimé : 12 600 €");
    expect(lines.join("\n")).not.toMatch(/[\u00a0\u202f]/);
  });

  it("présente les participants des deux côtés, puis les absents cités", () => {
    const text = composeVisitReport(input());
    expect(text).toContain(
      "Côté Menuiseries Vermont :\n- Claire Morel, Directrice commerciale (présente, prescriptrice, non décisionnaire)",
    );
    expect(text).toContain(
      "Côté Acme Conseil :\n- Julien Arnaud, Commercial (présent)",
    );
    expect(text).toContain(
      "Personnes citées mais absentes :\n- Marc Vermont, Directeur général (absent, décideur annoncé)",
    );
  });

  it("retombe sur le contact et le commercial quand le modèle n'a nommé personne", () => {
    const text = composeVisitReport(
      input({
        extraction: {
          ...extraction,
          participants: { client: [], nous: [], cites: [] },
        },
      }),
    );
    expect(text).toContain(
      "PARTICIPANTS\nCôté Menuiseries Vermont : Claire Morel\nCôté Acme Conseil : Julien Arnaud",
    );
  });

  it("dit qu'il s'agit du premier rendez-vous, ou liste les précédents avec leur grille", () => {
    expect(composeVisitReport(input())).toContain(
      "HISTORIQUE DU COMPTE\nPremier rendez-vous avec ce contact.",
    );
    const text = composeVisitReport(
      input({
        history: [
          {
            meetingAt: new Date("2026-09-10T08:00:00Z"),
            meetingType: "Découverte",
            sellerName: "Julien Arnaud",
            gridScore: 48,
          },
          {
            meetingAt: new Date("2026-08-02T08:00:00Z"),
            meetingType: null,
            sellerName: null,
            gridScore: null,
          },
        ],
      }),
    );
    expect(text).toContain("2 rendez-vous antérieurs avec ce contact :");
    expect(text).toContain(
      "- 10 septembre 2026 · Découverte · Julien Arnaud · grille 48 sur 100",
    );
    expect(text).toContain("- 2 août 2026 · non noté sur une grille");
  });

  it("met les thèmes en capitales et ne garde que les mots du prospect", () => {
    const text = composeVisitReport(input());
    expect(text).toContain(
      "DÉCLENCHEUR ET BESOIN EXPRIMÉ\nLa marge brute recule de 34 % à 29 % en deux ans, faute de défendre le prix.\n\n  « Mes commerciaux accordent des remises trop vite. »  C. Morel",
    );
    expect(text).not.toContain("Qu'est-ce qui vous fait dire");
    expect(text).not.toContain("Un thème sans titre");
  });

  it("n'écrit une rubrique facultative que si le transcript l'a nourrie", () => {
    const text = composeVisitReport(input());
    expect(text).toContain(
      "PÉRIMÈTRE ET VOLUMÉTRIE\nNeuf commerciaux terrain sur quatre secteurs.",
    );
    expect(text).not.toContain("CONCURRENCE ET ALTERNATIVES");
  });

  it("écrit chaque objection avec la réponse apportée et son effet", () => {
    const text = composeVisitReport(input());
    expect(text).toContain(
      "- Objection soulevée par C. Morel :\n  « Mes commerciaux ne peuvent pas quitter le terrain trois jours. »\n  Réponse apportée : Le programme se découpe en demi-journées sur site.\n  Effet : L'objection est levée sur le principe.",
    );
    const sans = composeVisitReport(
      input({ extraction: { ...extraction, objections: [] } }),
    );
    expect(sans).toContain(
      "OBJECTIONS ET RÉPONSES APPORTÉES\nAucune objection n'a été soulevée pendant le rendez-vous.",
    );
  });

  it("reprend le profil SONCAS du plus fort au plus faible, et dit quand rien ne le prouve", () => {
    const text = composeVisitReport(input());
    expect(text).toContain(
      "Motivations d'achat, SONCAS, sur 100 :\n- Argent 72 sur 100\n- Sécurité 55 sur 100\n- Confort 40 sur 100\n- Nouveauté 15 sur 100 (aucune preuve entendue)",
    );
    expect(text).toContain(
      "Ce qui fonde le levier principal, argent :\n  « Je veux voir la remise moyenne baisser. »",
    );
  });

  it("présente le DISC comme une manière de communiquer, avec les conseils de la fiche", () => {
    const text = composeVisitReport(input());
    expect(text).toContain(
      "Style de communication, DISC : style principal détecté D, dominance, à 70 sur 100. Le DISC décrit une manière de communiquer observée pendant ce rendez-vous, pas une personnalité.",
    );
    expect(text).toContain(
      "Comment lui parler : Nous vous suggérons d'aller droit aux chiffres.",
    );
    expect(text).toContain(
      "Ce qu'il vaut mieux éviter : Il vaut mieux éviter les présentations longues.",
    );
  });

  it("lit la maturité dans la grille, jalon par jalon", () => {
    const text = composeVisitReport(input());
    expect(text).toContain(
      "- Besoin identifié et formulé : acquis (critère B2, problème précis, niveau 4 sur 4)",
    );
    expect(text).toContain(
      "- Budget connu : à obtenir (critère C3, budget, niveau 1 sur 4)",
    );
    expect(text).toContain(
      "- Calendrier de décision : partiel (critère C4, calendrier de décision, niveau 2 sur 4)",
    );
    expect(text).toContain(
      "Qualification : 4 jalons acquis sur 7, 2 partiellement couverts.",
    );
  });

  it("dit que la maturité, les manques et la qualité ne sont pas évalués sans grille", () => {
    const text = composeVisitReport(input({ scorecard: null }));
    expect(text).toContain(
      "MATURITÉ DE L'AFFAIRE\nNon évaluée : ce rendez-vous n'a pas été noté sur une grille.",
    );
    expect(text).toContain(
      "CE QUI N'A PAS ÉTÉ COUVERT, ET LA QUESTION À POSER\nNon évalué : ce rendez-vous n'a pas été noté sur une grille.",
    );
    expect(text).toContain(
      "QUALITÉ DU RENDEZ-VOUS\nNon évaluée : ce rendez-vous n'a pas été noté sur une grille.",
    );
  });

  it("signale les rubriques vides au lieu de les remplir", () => {
    const text = composeVisitReport(
      input({
        extraction: {
          ...extraction,
          engagements: { texte: "", liste: [], citations: [] },
          prochainRendezVous: {
            quand: "",
            objectif: "",
            participants: "",
            aPreparer: "",
          },
          prochainesEtapes: [],
        },
        soncas: null,
        disc: null,
      }),
    );
    expect(text).toContain(
      "ENGAGEMENTS PRIS PENDANT LE RENDEZ-VOUS\n- Aucun engagement formalisé pendant le rendez-vous",
    );
    expect(text).toContain(
      "PROCHAIN RENDEZ-VOUS\nAucun prochain rendez-vous n'a été fixé pendant l'échange.",
    );
    expect(text).toContain(
      "PROCHAINES ÉTAPES\n- Aucune étape n'a été convenue pendant le rendez-vous",
    );
    expect(text).toContain(
      "PROFIL DE L'INTERLOCUTEUR\nProfil non disponible : les analyses SONCAS et DISC n'ont pas abouti.",
    );
  });

  it("écrit le prochain rendez-vous et les étapes convenues", () => {
    const text = composeVisitReport(input());
    expect(text).toContain(
      "PROCHAIN RENDEZ-VOUS\nQuand : Le 7 octobre en fin de matinée\nObjectif : Présenter la proposition au directeur général\nParticipants attendus : Claire Morel, Marc Vermont, Julien Arnaud\nÀ préparer : Trois chiffres et quinze minutes de présentation",
    );
    expect(text).toContain(
      "PROCHAINES ÉTAPES\n- Envoyer le récapitulatif · cet après-midi · Julien Arnaud",
    );
  });

  it("reprend les manques de la grille avec la question à poser", () => {
    const text = composeVisitReport(input());
    expect(text).toContain(
      "- Budget\n  Constat : Le budget est annoncé sans être discuté.\n  À demander : « Pour vous proposer une solution à la bonne taille, j'ai besoin de situer votre budget : où vous situez-vous ? »",
    );
  });

  it("donne la qualité par bloc, le point de vigilance, et la question du prochain échange", () => {
    const text = composeVisitReport(input());
    expect(text).toContain(
      "Grille « Rendez-vous de découverte » : 61 sur 100, sur 25 critères.",
    );
    expect(text).toContain("- C. Décision : 10 sur 24");
    expect(text).toContain(
      "Point de vigilance : le bloc décision, à 42 % de son poids.",
    );
    expect(text).toContain(
      "Ce qui a fonctionné :\n- La reformulation du besoin valide le problème avec le prospect.",
    );
    expect(text).not.toContain("À arrêter :");
    expect(text).toContain(
      "Question à poser au prochain échange :\n  « Si rien ne change d'ici un an, qu'est-ce que cela vous coûte ? »",
    );
    expect(text).toContain(
      "Défi du commercial : Poser une question de chiffrage avant de présenter le programme.",
    );
  });

  it("finit sur la note de méthode, sans ligne vide en trop ni tiret cadratin", () => {
    const text = composeVisitReport(input());
    expect(text.endsWith(`NOTE DE MÉTHODE\n${VISIT_REPORT_METHOD_NOTE}`)).toBe(
      true,
    );
    expect(text).not.toContain("\n\n\n");
    expect(text).not.toContain("\u2014");
  });
});

describe("isVisitReportHeading", () => {
  it("reconnaît les titres en capitales, et rien d'autre", () => {
    expect(isVisitReportHeading("PROFIL DE L'INTERLOCUTEUR")).toBe(true);
    expect(
      isVisitReportHeading(
        "CE QUI N'A PAS ÉTÉ COUVERT, ET LA QUESTION À POSER",
      ),
    ).toBe(true);
    expect(isVisitReportHeading("Quand : Le 7 octobre")).toBe(false);
    expect(isVisitReportHeading("- Argent 72 sur 100")).toBe(false);
    expect(isVisitReportHeading("  « OK »")).toBe(false);
    expect(isVisitReportHeading("")).toBe(false);
  });
});

describe("visitReportExtractionSchema", () => {
  it("accepte une extraction où chaque rubrique absente est vide", () => {
    const parsed = visitReportExtractionSchema.safeParse({
      ...extraction,
      origine: "",
      themes: [],
      perimetre: { texte: "", citations: [] },
      concurrence: { texte: "", citations: [] },
      objections: [],
      engagements: { texte: "", liste: [], citations: [] },
      prochainRendezVous: {
        quand: "",
        objectif: "",
        participants: "",
        aPreparer: "",
      },
      prochainesEtapes: [],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepte un titre de thème ou une échéance plus longs que prévu", () => {
    /*
      Un dépassement de plafond fait perdre tout le compte rendu : les
      plafonds laissent donc une large marge au-delà de ce que la consigne
      demande.
    */
    const parsed = visitReportExtractionSchema.safeParse({
      ...extraction,
      themes: [
        {
          titre:
            "Le contexte : une équipe de neuf commerciaux sur quatre secteurs, et une marge brute qui recule depuis deux ans",
          texte: "Claire décrit son équipe et la baisse de la marge.",
          citations: [],
        },
      ],
      prochainesEtapes: [
        {
          action: "Envoyer la proposition",
          echeance:
            "d'ici vendredi, avant la présentation au directeur général et bien avant le comité de direction de novembre",
          porteur: "Julien Arnaud",
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("exige la phrase de synthèse", () => {
    expect(
      visitReportExtractionSchema.safeParse({ ...extraction, enUnePhrase: "" })
        .success,
    ).toBe(false);
  });
});

describe("les retours de la relecture du 24 septembre", () => {
  /** Les citations attribuées des thèmes, celles qui portent le nom de leur auteur. */
  function quotesOf(text: string): string[] {
    return text
      .split("\n")
      .filter((line) => line.startsWith("  « ") && line.includes("»  "))
      .map((line) => line.trim());
  }

  it("garde les mots de Jeanne quand le commercial s'appelle Jean", () => {
    const text = composeVisitReport(
      input({
        sellerName: "Jean Dupont",
        extraction: {
          ...extraction,
          participants: {
            client: [
              { nom: "Jeanne Martin", role: "Acheteuse", statut: "présente" },
            ],
            nous: [],
            cites: [],
          },
          themes: [
            {
              titre: "Le besoin",
              texte: "Le besoin est posé.",
              citations: [
                {
                  qui: "Jeanne Martin",
                  moment: "",
                  texte: "Nous perdons de la marge.",
                },
                {
                  qui: "Jean-Pierre (DAF)",
                  moment: "",
                  texte: "Le budget est serré.",
                },
                {
                  qui: "Jean",
                  moment: "",
                  texte: "Combien cela vous coûte-t-il ?",
                },
                {
                  qui: "Jean Dupont, commercial",
                  moment: "",
                  texte: "Je vous propose un essai.",
                },
              ],
            },
          ],
        },
      }),
    );
    expect(quotesOf(text)).toEqual([
      "« Nous perdons de la marge. »  J. Martin",
      "« Le budget est serré. »  J.-P. (DAF)",
    ]);
  });

  it("garde un prénom seul quand le côté client porte aussi ce prénom", () => {
    const text = composeVisitReport(
      input({
        sellerName: "Julien Arnaud",
        extraction: {
          ...extraction,
          participants: {
            client: [
              { nom: "Julien Morel", role: "Directeur", statut: "présent" },
            ],
            nous: [],
            cites: [],
          },
          themes: [
            {
              titre: "Le besoin",
              texte: "Le besoin est posé.",
              citations: [
                {
                  qui: "Julien",
                  moment: "",
                  texte: "Nous voulons des chiffres.",
                },
              ],
            },
          ],
        },
      }),
    );
    expect(quotesOf(text)).toEqual(["« Nous voulons des chiffres. »  Julien"]);
  });

  it("donne le nombre réel de rendez-vous antérieurs quand l'historique en montre une partie", () => {
    const text = composeVisitReport(
      input({
        history: [
          {
            meetingAt: new Date("2026-09-10T08:00:00Z"),
            meetingType: "Découverte",
            sellerName: "Julien Arnaud",
            gridScore: 48,
          },
        ],
        historyTotal: 8,
      }),
    );
    expect(text).toContain(
      "8 rendez-vous antérieurs avec ce contact, dont le plus récent :",
    );
  });

  it("n'écrit pas le score de grille d'un rendez-vous qui n'est pas à montrer", () => {
    const text = composeVisitReport(
      input({
        history: [
          {
            meetingAt: new Date("2026-09-10T08:00:00Z"),
            meetingType: "Découverte",
            sellerName: "Julie Martin",
          },
        ],
      }),
    );
    expect(text).toContain("- 10 septembre 2026 · Découverte · Julie Martin\n");
    expect(text).not.toContain("Julie Martin · grille");
  });

  it("n'annonce pas un premier rendez-vous quand l'historique n'a pas pu être lu", () => {
    const text = composeVisitReport(input({ history: null }));
    expect(text).toContain(
      "HISTORIQUE DU COMPTE\nHistorique non disponible : les rendez-vous précédents n'ont pas pu être lus.",
    );
    expect(text).not.toContain("Premier rendez-vous");
  });

  it("garde le jour saisi pour un rendez-vous tard le soir", () => {
    const lines = composeVisitReport(
      input({
        meeting: {
          ...input().meeting,
          // 23 h 30 à Paris, 21 h 30 en temps universel.
          meetingAt: new Date("2026-09-24T21:30:00Z"),
        },
      }),
    ).split("\n");
    expect(lines[1]).toBe(
      "Menuiseries Vermont · 24 septembre 2026 · Découverte · 40 min",
    );
  });

  it("retire la grille et le coaching pour un membre qui n'y a pas accès", () => {
    const full = composeVisitReport(
      input({
        history: [
          {
            meetingAt: new Date("2026-09-10T08:00:00Z"),
            meetingType: "Découverte",
            sellerName: "Julien Arnaud",
            gridScore: 48,
          },
        ],
      }),
    );
    const text = visitReportWithoutSellerCoaching(full);
    const titles = text
      .split("\n")
      .filter((line, i, all) => isVisitReportHeading(line, all[i - 1]));
    expect(titles).toEqual([
      VISIT_REPORT_TITLE,
      "PARTICIPANTS",
      "HISTORIQUE DU COMPTE",
      "EN UNE PHRASE",
      "DÉCLENCHEUR ET BESOIN EXPRIMÉ",
      "PÉRIMÈTRE ET VOLUMÉTRIE",
      "OBJECTIONS ET RÉPONSES APPORTÉES",
      "PROFIL DE L'INTERLOCUTEUR",
      "ENGAGEMENTS PRIS PENDANT LE RENDEZ-VOUS",
      "PROCHAIN RENDEZ-VOUS",
      "PROCHAINES ÉTAPES",
      "NOTE DE MÉTHODE",
    ]);
    expect(text).toContain(
      "- 10 septembre 2026 · Découverte · Julien Arnaud\n",
    );
    expect(text).not.toMatch(/grille|Défi du commercial|niveau \d sur 4/);
    expect(text).not.toMatch(/\n\n\n/);
  });

  it("reconnaît un titre après une ligne vide, même court ou commençant par un chiffre", () => {
    expect(isVisitReportHeading("ROI", "")).toBe(true);
    expect(isVisitReportHeading("3 SITES À ÉQUIPER", "")).toBe(true);
    expect(isVisitReportHeading("« CLÉ EN MAIN »", "")).toBe(true);
    expect(isVisitReportHeading("RAS.", "PÉRIMÈTRE ET VOLUMÉTRIE")).toBe(false);
    expect(isVisitReportHeading("- RAS", "")).toBe(false);
  });
});

describe("shortPersonName", () => {
  it("signe une citation comme la maquette : l'initiale du prénom et le nom", () => {
    expect(shortPersonName("Hélène Vasseur")).toBe("H. Vasseur");
    expect(shortPersonName("Jean-Pierre Martin")).toBe("J.-P. Martin");
    expect(shortPersonName("Claire Morel, directrice")).toBe(
      "C. Morel, directrice",
    );
  });

  it("laisse tel quel un prénom seul, un titre ou une désignation", () => {
    expect(shortPersonName("Julien")).toBe("Julien");
    expect(shortPersonName("Mme Vasseur")).toBe("Mme Vasseur");
    expect(shortPersonName("le prospect")).toBe("le prospect");
    expect(shortPersonName("  ")).toBe("");
  });
});

describe("l'en-tête et les moments, comme la maquette", () => {
  it("écrit l'étape, le potentiel et la fiabilité sur la troisième ligne", () => {
    const lines = composeVisitReport(
      input({
        meeting: {
          ...input().meeting,
          pipelineStage: "Qualifié",
          analysisReliability: "bonne",
        },
      }),
    ).split("\n");
    expect(lines[2]).toBe(
      "Étape : Qualifié · Potentiel estimé : 12 600 € · Fiabilité de l'analyse : bonne",
    );
  });

  it("date une citation et une objection quand le transcript porte un horodatage", () => {
    const text = composeVisitReport(
      input({
        extraction: {
          ...extraction,
          themes: [
            {
              titre: "Le besoin",
              texte: "Le besoin est posé.",
              citations: [
                {
                  qui: "Claire Morel",
                  moment: "02'24",
                  texte: "Nous perdons de la marge.",
                },
              ],
            },
          ],
          objections: [
            {
              qui: "Claire Morel",
              moment: "14'30",
              objection: "Nous ne voulons pas d'un outil de plus.",
              reponse: "Aucune ressaisie.",
              effet: "Levée à moitié.",
            },
          ],
        },
      }),
    );
    expect(text).toContain("  « Nous perdons de la marge. »  C. Morel, 02'24");
    expect(text).toContain("- Objection soulevée par C. Morel à 14'30 :");
  });
});

describe("isCurrentVisitReport", () => {
  it("reconnaît la forme d'aujourd'hui et rejette celle d'avant le lot 80a", () => {
    expect(
      isCurrentVisitReport("COMPTE RENDU DE VISITE\nMenuiseries Vermont"),
    ).toBe(true);
    expect(isCurrentVisitReport("  COMPTE RENDU DE VISITE")).toBe(true);
    expect(
      isCurrentVisitReport(
        "Compte-rendu de visite · Claire Morel · 24/09/2026",
      ),
    ).toBe(false);
    expect(isCurrentVisitReport("")).toBe(false);
    expect(isCurrentVisitReport(null)).toBe(false);
  });
});

describe("withMomentsFromTranscript", () => {
  it("ne garde un moment que si le transcript le porte tel quel", () => {
    const withMoments = {
      ...extraction,
      themes: [
        {
          titre: "Le besoin",
          texte: "Le besoin est posé.",
          citations: [
            {
              qui: "Claire Morel",
              moment: "02'24",
              texte: "Nous perdons de la marge.",
            },
            { qui: "Claire Morel", moment: "18'15", texte: "Le suivi manque." },
          ],
        },
      ],
      objections: [
        {
          qui: "Claire Morel",
          moment: "14'30",
          objection: "Pas un outil de plus.",
          reponse: "Aucune ressaisie.",
          effet: "Levée à moitié.",
        },
      ],
    };
    const kept = withMomentsFromTranscript(
      withMoments,
      "02'24 Claire : Nous perdons de la marge.\n14'30 Claire : Pas un outil de plus.",
    );
    expect(kept.themes[0].citations.map((q) => q.moment)).toEqual([
      "02'24",
      "",
    ]);
    expect(kept.objections[0].moment).toBe("14'30");

    const none = withMomentsFromTranscript(
      withMoments,
      "Claire : Nous perdons de la marge.",
    );
    expect(none.themes[0].citations.map((q) => q.moment)).toEqual(["", ""]);
    expect(none.objections[0].moment).toBe("");
  });
});
