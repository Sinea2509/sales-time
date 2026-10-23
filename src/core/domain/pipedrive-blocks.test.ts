import { describe, expect, it } from "@jest/globals";
import {
  composePipedriveBlocks,
  pipedriveExtractionSchema,
  projectPotential,
  withVerifiedQuotes,
  type PipedriveContext,
  type PipedriveExtraction,
} from "./pipedrive-blocks";

const EMPTY_PROJECT = {
  theme: null,
  audience: null,
  participantProfile: null,
  currentLevel: null,
  context: null,
  when: null,
  successCriteria: null,
  skills: null,
  deliverables: null,
  budget: null,
  urgency: null,
  whyUs: null,
  decisionCriteria: null,
  nextMilestone: null,
  competitors: null,
  trainingHistory: null,
  closingScore: null,
  closingJustification: null,
  format: null,
  place: null,
  logistics: null,
  language: null,
  opco: null,
  missingInfo: [],
  nextQuestions: [],
};

const EXTRACTION: PipedriveExtraction = {
  company: "Maison Leroux",
  themes: ["Vente terrain"],
  tension: "haute",
  decision: "Avant fin novembre",
  nextMeeting: "Mardi 28 octobre, 10h, sur place",
  status: "Proposition à envoyer ce soir.",
  projects: [
    {
      name: "Découverte client",
      target: "Commerciaux terrain",
      format: "Présentiel",
      maturity: "projet_valide",
      groups: 2,
      daysPerGroup: null,
      tension: "haute",
      competitor: null,
    },
    {
      name: "Management",
      target: null,
      format: null,
      maturity: "idee_floue",
      groups: null,
      daysPerGroup: null,
      tension: null,
      competitor: null,
    },
  ],
  sineaCommitments: ["Envoyer la proposition ce soir"],
  clientCommitments: [],
  nextMeetingGoal: "Valider le budget",
  nextMeetingAngle: "Le coût de l'inaction",
  followUp: null,
  watchPoints: [
    { risk: "Budget serré", quote: "il voudra voir un budget clair" },
  ],
  identity: {
    headcount: "14 commerciaux",
    sector: "Négoce",
    opco: null,
    contactFirstName: "Hélène",
    contactRole: "Directrice des ventes",
    contactInfluence: "prescripteur",
    decisionCircuit: "Le directeur général signe",
    trainingBudget: null,
    tools: null,
    trainingHistory: null,
    competition: null,
  },
  trainingProject: EMPTY_PROJECT,
};

const CTX: PipedriveContext = {
  company: null,
  prospectName: "Hélène Leroux",
  meetingAt: new Date("2026-10-21T10:00:00Z"),
  meetingRank: 2,
  salesScore: 72,
  medalName: "Or",
  challenge: "Obtenir le budget",
};

describe("projectPotential", () => {
  it("compte 3 jours par groupe quand la durée n'est pas dite", () => {
    expect(projectPotential({ groups: 2, daysPerGroup: null })).toEqual({
      amount: 11340,
      calculation: "2 grp × 3j × 1 890€",
    });
  });

  it("ne chiffre pas un projet sans nombre de groupes", () => {
    expect(projectPotential({ groups: null, daysPerGroup: 2 })).toBeNull();
  });
});

describe("composePipedriveBlocks", () => {
  const blocks = composePipedriveBlocks(EXTRACTION, CTX);

  it("écrit le Bloc SEED avec le rang, le score et le potentiel calculé", () => {
    expect(blocks.seed).toContain("Maison Leroux · 21/10/2026 · R2");
    expect(blocks.seed).toContain("POTENTIEL : 11 340€ (2 grp × 3j × 1 890€)");
    expect(blocks.seed).toContain("SCORE : 72/100 (Or)");
    expect(blocks.seed).toContain("STRATÉGIE R3 : Objectif Valider le budget");
    expect(blocks.seed).toContain("TYPE:R2|DATE:21/10/2026|SCORE:72/100");
    expect(blocks.seed).toContain("DEFI:Obtenir le budget");
    expect(blocks.potentialTotal).toBe(11340);
  });

  it("range une idée floue sans information dans les sujets en veille", () => {
    expect(blocks.seed).toContain("SUJETS EN VEILLE : Management");
    expect(blocks.seed).not.toContain("PROJET 2");
  });

  it("écrit « Non abordé » pour ce que le rendez-vous n'a pas abordé", () => {
    expect(blocks.identity).toContain("OPCO : Non abordé");
    expect(blocks.identity).toContain(
      "Interlocuteur clé : Hélène · Directrice des ventes (Prescripteur)",
    );
    expect(blocks.seed).toContain("ENGAGEMENTS CLIENT : Aucun");
  });

  it("dit ce qui manque quand le projet de formation n'est pas assez qualifié", () => {
    expect(blocks.trainingProjectIncomplete).toBe(true);
    expect(blocks.trainingProject).toContain("Pas assez d'éléments");
    expect(blocks.trainingProject).toContain("la cible");
  });

  it("remplit le projet de formation quand cible, contexte et thématique sont là", () => {
    const full = composePipedriveBlocks(
      {
        ...EXTRACTION,
        trainingProject: {
          ...EMPTY_PROJECT,
          theme: "Découverte client",
          audience: "14 commerciaux, 2 groupes",
          context: "Taux de transformation en baisse",
          closingScore: 7,
          closingJustification: "Budget dans l'ordre de grandeur",
        },
      },
      CTX,
    );
    expect(full.trainingProjectIncomplete).toBe(false);
    expect(full.trainingProject).toContain(
      "📊 POTENTIEL DE CLOSING : 7/10 · Budget dans l'ordre de grandeur",
    );
  });

  it("préfère le nom d'entreprise saisi sur la fiche", () => {
    const own = composePipedriveBlocks(EXTRACTION, {
      ...CTX,
      company: "Leroux SAS",
    });
    expect(own.identity).toContain("CARTE D'IDENTITÉ · Leroux SAS");
  });
});

describe("withVerifiedQuotes", () => {
  it("garde le risque mais retire une citation absente du transcript", () => {
    const out = withVerifiedQuotes(EXTRACTION, () => false);
    expect(out.watchPoints).toEqual([{ risk: "Budget serré", quote: "" }]);
  });
});

describe("pipedriveExtractionSchema", () => {
  it("accepte une extraction complète", () => {
    expect(pipedriveExtractionSchema.safeParse(EXTRACTION).success).toBe(true);
  });
});
