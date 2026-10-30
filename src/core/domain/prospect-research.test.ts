import { describe, expect, it } from "@jest/globals";
import {
  cleanSources,
  prospectResearchAsText,
  prospectResearchSchema,
  type ProspectResearch,
} from "./prospect-research";

const RESEARCH: ProspectResearch = {
  company: {
    headquarters: "Lyon",
    headcount: "250 salariés",
    sector: "Logistique",
    dynamic: "croissance",
    dynamicWhy: "Trois entrepôts ouverts en 2026",
    tools: ["Salesforce", "Microsoft 365"],
    realJob: "Ils livrent les colis des magasins.",
  },
  decisionMaker: { discStyle: null, discWhy: null, iceBreaker: null },
  pain: {
    hiring: ["Six chefs d'équipe : croissance rapide"],
    cultureKeywords: ["Engagement"],
  },
  attackPlan: {
    priorityOffer: "Management",
    offerWhy: "Nouveaux chefs d'équipe à former",
    goldenQuestions: [
      "J'ai vu que vous ouvrez trois entrepôts, comment formez-vous vos chefs d'équipe ?",
    ],
    likelyObjections: [
      {
        objection: "Nous formons déjà en interne",
        answer: "Vos six recrutements dépassent ce que l'interne absorbe.",
      },
    ],
  },
  clientReferences: [],
  unknowns: ["DISC non estimable"],
};

describe("cleanSources", () => {
  it("garde les adresses web uniques, dans l'ordre, et écarte le reste", () => {
    expect(
      cleanSources([
        "https://a.fr/page",
        "https://a.fr/page/",
        "pas une adresse",
        "javascript:alert(1)",
        "http://b.fr",
      ]),
    ).toEqual(["https://a.fr/page", "http://b.fr/"]);
  });

  it("s'arrête à huit sources", () => {
    expect(
      cleanSources(Array.from({ length: 12 }, (_, i) => `https://s${i}.fr`)),
    ).toHaveLength(8);
  });
});

describe("prospectResearchAsText", () => {
  const text = prospectResearchAsText(RESEARCH, {
    companyName: "Logis",
    personName: "Paul Martin",
    sources: ["https://logis.fr/"],
  });

  it("reprend les quatre parties de la méthode", () => {
    expect(text).toContain("PRÉPARATION · Logis · Paul Martin");
    expect(text).toContain(
      "- Dynamique : En croissance (Trois entrepôts ouverts en 2026)",
    );
    expect(text).toContain("- Outils : Salesforce, Microsoft 365");
    expect(text).toContain(
      "- Question en or 1 : J'ai vu que vous ouvrez trois entrepôts",
    );
    expect(text).toContain(
      "- Objection à anticiper : Nous formons déjà en interne : Vos six recrutements",
    );
  });

  it("dit « Non trouvé » au lieu d'inventer", () => {
    expect(text).toContain("- DISC estimé : Non trouvé");
    expect(text).toContain("- Ice breaker : Non trouvé");
  });

  it("cite ses sources", () => {
    expect(text).toContain("SOURCES\n- https://logis.fr/");
  });
});

describe("prospectResearchSchema", () => {
  it("accepte une fiche complète", () => {
    expect(prospectResearchSchema.safeParse(RESEARCH).success).toBe(true);
  });
});
