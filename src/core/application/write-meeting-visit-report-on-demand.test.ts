import { summarizeMeetingDetail } from "./summarize-meeting-detail";
import { writeMeetingVisitReportOnDemand } from "./write-meeting-visit-report-on-demand";

jest.mock("@/lib/env", () => ({
  getEnv: () => ({ AI_GATEWAY_API_KEY: "cle-de-test" }),
}));

jest.mock("./summarize-meeting-detail", () => ({
  summarizeMeetingDetail: jest.fn(),
}));

const summarizeMock = summarizeMeetingDetail as jest.MockedFunction<
  typeof summarizeMeetingDetail
>;

const RAPPORT = [
  "COMPTE RENDU DE VISITE",
  "",
  "Menuiseries Vermont · 25 septembre 2026 · Découverte · 40 min",
  "",
  "PARTICIPANTS",
  "",
  "- Claire Morel, directrice commerciale (présent)",
  "",
  "MATURITÉ DE L'AFFAIRE",
  "",
  "- Budget connu : acquis",
  "",
  "PROCHAINES ÉTAPES",
  "",
  "- Envoyer la proposition · d'ici vendredi · Julien Arnaud",
].join("\n");

function meeting(overrides: Record<string, unknown> = {}) {
  return {
    id: "m1",
    sellerUserId: "u-vendeur",
    status: "READY",
    transcript: "Bonjour Claire, merci de me recevoir.",
    visitReportDraft: null,
    analyses: [],
    ...overrides,
  };
}

function deps(found: unknown) {
  return {
    analysis: {},
    prompts: {},
    organizationPrompts: {},
    meetings: {
      findMeetingDetailWithAnalyses: jest.fn().mockResolvedValue(found),
    },
  } as never;
}

const manager = { internalUserId: "u-manager", canManageOrganization: true };
const vendeur = { internalUserId: "u-vendeur", canManageOrganization: false };
const autreMembre = { internalUserId: "u-autre", canManageOrganization: false };

describe("writeMeetingVisitReportOnDemand", () => {
  beforeEach(() => summarizeMock.mockReset());

  it("rend le compte rendu enregistré sans appeler le modèle", async () => {
    const result = await writeMeetingVisitReportOnDemand(
      deps(meeting({ visitReportDraft: `  ${RAPPORT}\n` })),
      { organizationId: "org1", meetingId: "m1", actor: manager },
    );
    expect(result).toEqual({ kind: "text", text: RAPPORT });
    expect(summarizeMock).not.toHaveBeenCalled();
  });

  it("retire la maturité de l'affaire pour un membre qui n'est ni le commercial ni un manager", async () => {
    const result = await writeMeetingVisitReportOnDemand(
      deps(meeting({ visitReportDraft: RAPPORT })),
      { organizationId: "org1", meetingId: "m1", actor: autreMembre },
    );
    expect(result.kind).toBe("text");
    const text = result.kind === "text" ? result.text : "";
    expect(text).toContain("PARTICIPANTS");
    expect(text).toContain("PROCHAINES ÉTAPES");
    expect(text).not.toContain("MATURITÉ DE L'AFFAIRE");
    expect(text).not.toContain("Budget connu");
  });

  it("écrit le compte rendu à la demande quand il manque sur un rendez-vous analysé", async () => {
    summarizeMock.mockResolvedValue({
      meetingSynthesis: RAPPORT,
      interlocutorProfile: "",
      fromAi: true,
    });
    const result = await writeMeetingVisitReportOnDemand(deps(meeting()), {
      organizationId: "org1",
      meetingId: "m1",
      actor: vendeur,
    });
    expect(result).toEqual({ kind: "text", text: RAPPORT });
    expect(summarizeMock).toHaveBeenCalledTimes(1);
    expect(summarizeMock.mock.calls[0][1]).toMatchObject({
      organizationId: "org1",
      discResult: null,
      soncasResult: null,
      kissResult: null,
      scorecardResult: null,
    });
  });

  it("dit l'échec plutôt que de rendre le texte indicatif comme un compte rendu", async () => {
    summarizeMock.mockResolvedValue({
      meetingSynthesis: "Compte-rendu en cours de génération.",
      interlocutorProfile: "",
      fromAi: false,
    });
    const result = await writeMeetingVisitReportOnDemand(deps(meeting()), {
      organizationId: "org1",
      meetingId: "m1",
      actor: manager,
    });
    expect(result).toEqual({ kind: "failed" });
  });

  it("attend la fin de l'analyse avant d'écrire", async () => {
    const result = await writeMeetingVisitReportOnDemand(
      deps(meeting({ status: "PROCESSING" })),
      { organizationId: "org1", meetingId: "m1", actor: manager },
    );
    expect(result).toEqual({ kind: "not_ready" });
    expect(summarizeMock).not.toHaveBeenCalled();
  });

  it("n'écrit rien sans transcript", async () => {
    const result = await writeMeetingVisitReportOnDemand(
      deps(meeting({ transcript: "   " })),
      { organizationId: "org1", meetingId: "m1", actor: manager },
    );
    expect(result).toEqual({ kind: "unavailable", reason: "NO_TRANSCRIPT" });
  });

  it("dit l'absence du rendez-vous plutôt que de deviner", async () => {
    const result = await writeMeetingVisitReportOnDemand(deps(null), {
      organizationId: "org1",
      meetingId: "m1",
      actor: manager,
    });
    expect(result).toEqual({ kind: "not_found" });
  });
});
