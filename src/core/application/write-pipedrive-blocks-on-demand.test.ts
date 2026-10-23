import type { PipedriveExtraction } from "@/src/core/domain/pipedrive-blocks";
import { writePipedriveBlocksOnDemand } from "./write-pipedrive-blocks-on-demand";

jest.mock("@/lib/env", () => ({
  getEnv: () => ({ AI_GATEWAY_API_KEY: "cle-de-test" }),
}));

jest.mock("@/lib/load-analysis-model", () => ({
  resolvePromptGatewayModel: async () => "anthropic/claude-haiku-5.5",
}));

const TRANSCRIPT =
  "Commercial : qui décidera ?\nProspect : le directeur général, il voudra voir un budget clair.";

const EXTRACTION = {
  company: "Maison Leroux",
  themes: ["Vente terrain"],
  tension: "moyenne",
  decision: null,
  nextMeeting: null,
  status: "Proposition à envoyer.",
  projects: [],
  sineaCommitments: [],
  clientCommitments: [],
  nextMeetingGoal: null,
  nextMeetingAngle: null,
  followUp: null,
  watchPoints: [
    { risk: "Budget", quote: "il voudra voir un budget clair" },
    { risk: "Délai", quote: "nous signerons demain sans faute" },
  ],
  identity: {
    headcount: null,
    sector: null,
    opco: null,
    contactFirstName: null,
    contactRole: null,
    contactInfluence: null,
    decisionCircuit: null,
    trainingBudget: null,
    tools: null,
    trainingHistory: null,
    competition: null,
  },
  trainingProject: {
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
  },
} satisfies PipedriveExtraction;

const MEETING = {
  id: "m2",
  personId: "p1",
  prospectName: "Hélène Leroux",
  prospectCompany: null,
  meetingAt: new Date("2026-10-21T10:00:00Z"),
  meetingType: null,
  status: "READY",
  transcript: TRANSCRIPT,
  notes: null,
  analyses: [],
};

function makeDeps(options: {
  features?: string[];
  meeting?: Record<string, unknown> | null;
  extract?: () => Promise<unknown>;
}) {
  const extract = jest.fn(options.extract ?? (async () => EXTRACTION));
  return {
    extract,
    deps: {
      analysis: { extractPipedriveBlocks: extract },
      prompts: {},
      organizationFeatures: {
        listEnabledFeatures: async () =>
          options.features ?? ["pipedrive_blocks"],
      },
      meetings: {
        findMeetingDetailWithAnalyses: async ({ id }: { id: string }) =>
          id === "m1"
            ? { visitReportDraft: "COMPTE RENDU DE VISITE\n14 salariés" }
            : options.meeting === undefined
              ? MEETING
              : options.meeting,
        listMeetingsForPersonOrdered: async () => [
          { id: "m2", meetingAt: MEETING.meetingAt },
          { id: "m1", meetingAt: new Date("2026-10-14T10:00:00Z") },
        ],
      },
    } as never,
  };
}

const INPUT = { organizationId: "org", meetingId: "m2" };

describe("writePipedriveBlocksOnDemand", () => {
  it("ne rend rien aux organisations qui n'ont pas la fonctionnalité", async () => {
    const { deps, extract } = makeDeps({ features: [] });
    expect(await writePipedriveBlocksOnDemand(deps, INPUT)).toEqual({
      kind: "not_enabled",
    });
    expect(extract).not.toHaveBeenCalled();
  });

  it("attend la fin de l'analyse", async () => {
    const { deps } = makeDeps({
      meeting: { ...MEETING, status: "PROCESSING" },
    });
    expect((await writePipedriveBlocksOnDemand(deps, INPUT)).kind).toBe(
      "not_ready",
    );
  });

  it("compose les blocs avec le rang du rendez-vous et le compte rendu précédent", async () => {
    const { deps, extract } = makeDeps({});
    const out = await writePipedriveBlocksOnDemand(deps, INPUT);
    expect(out.kind).toBe("blocks");
    if (out.kind !== "blocks") return;
    expect(out.blocks.seed).toContain("· R2");
    expect((extract.mock.calls[0] as unknown[] | undefined)?.[0]).toMatchObject(
      {
        previousReport: "COMPTE RENDU DE VISITE\n14 salariés",
      },
    );
  });

  it("n'écrit dans le CRM que les citations présentes dans le transcript", async () => {
    const { deps } = makeDeps({});
    const out = await writePipedriveBlocksOnDemand(deps, INPUT);
    if (out.kind !== "blocks") throw new Error(out.kind);
    expect(out.blocks.seed).toContain(
      "Budget « il voudra voir un budget clair »",
    );
    expect(out.blocks.seed).not.toContain("signerons demain");
  });

  it("rend un échec sans lever quand le modèle échoue", async () => {
    const { deps } = makeDeps({
      extract: async () => {
        throw new Error("passerelle indisponible");
      },
    });
    expect((await writePipedriveBlocksOnDemand(deps, INPUT)).kind).toBe(
      "failed",
    );
  });
});
