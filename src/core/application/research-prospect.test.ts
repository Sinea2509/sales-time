import { researchProspect } from "./research-prospect";

jest.mock("@/lib/env", () => ({
  getEnv: () => ({ AI_GATEWAY_API_KEY: "cle-de-test" }),
}));

jest.mock("@/lib/load-analysis-model", () => ({
  resolvePromptGatewayModel: async () => "anthropic/claude-haiku-5.5",
}));

const RESEARCH = {
  company: {
    headquarters: "Lyon",
    headcount: null,
    sector: null,
    dynamic: null,
    dynamicWhy: null,
    tools: [],
    realJob: null,
  },
  decisionMaker: { discStyle: null, discWhy: null, iceBreaker: null },
  pain: { hiring: [], cultureKeywords: [] },
  attackPlan: { priorityOffer: null, offerWhy: null, goldenQuestions: [] },
  clientReferences: [],
  unknowns: [],
};

function makeDeps(options: { web?: () => Promise<unknown> } = {}) {
  const researchOnWeb = jest.fn(
    options.web ??
      (async () => ({
        text: "Siège à Lyon.",
        sources: ["https://logis.fr", "https://logis.fr/"],
      })),
  );
  const structure = jest.fn(async () => RESEARCH);
  return {
    researchOnWeb,
    structure,
    deps: {
      analysis: {
        researchOnWeb,
        structureProspectResearch: structure,
      },
      prompts: {},
      organizationSettings: {
        findByOrganizationId: async () => ({
          playbook: {
            clientReferences: ["Transdev · Management de proximité"],
          },
        }),
      },
    } as never,
  };
}

const INPUT = {
  organizationId: "org",
  companyName: "Logis",
  website: "https://logis.fr",
  personName: "Paul Martin",
  personRole: "DRH",
  linkedinUrl: null,
  profileText: "Passionné de voile.",
  targetStage: "Découverte",
};

describe("researchProspect", () => {
  it("cherche sur le web, puis range la fiche avec le profil collé et les références", async () => {
    const { deps, researchOnWeb, structure } = makeDeps();
    const out = await researchProspect(deps, INPUT);
    expect(out).toEqual({
      ok: true,
      research: RESEARCH,
      sources: ["https://logis.fr/"],
    });
    expect((researchOnWeb.mock.calls[0] as unknown[])[0]).toMatchObject({
      model: "perplexity/sonar-pro",
    });
    const prompt = (
      (structure.mock.calls[0] as unknown[])[0] as { userPrompt: string }
    ).userPrompt;
    expect(prompt).toContain("<recherche_web>\nSiège à Lyon.");
    expect(prompt).toContain("Passionné de voile.");
    expect(prompt).toContain("- Transdev · Management de proximité");
  });

  it("rend un échec sans lever quand la recherche web échoue", async () => {
    const { deps } = makeDeps({
      web: async () => {
        throw new Error("passerelle indisponible");
      },
    });
    expect(await researchProspect(deps, INPUT)).toEqual({
      ok: false,
      error: "FAILED",
    });
  });
});
