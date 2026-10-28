import { reviseFollowUpEmail } from "./revise-follow-up-email";

jest.mock("@/lib/load-analysis-model", () => ({
  resolvePromptGatewayModel: async () => "anthropic/claude-haiku-5.5",
}));

const MEETING = {
  meetingAt: new Date("2026-10-21T10:00:00Z"),
  prospectName: "Hélène Martin",
  prospectCompany: "Maison Martin",
  meetingType: "Découverte",
  transcript: "Commercial : on se revoit mardi à dix heures ?",
};

describe("reviseFollowUpEmail", () => {
  it("transmet le mail, la demande et le transcript, et rend le mail retouché", async () => {
    const revise = jest.fn(async () => ({
      subject: "Notre rendez-vous de mardi",
      body: "Bonjour Madame Martin,\n\nÀ mardi.",
    }));
    const out = await reviseFollowUpEmail(
      { analysis: { reviseFollowUpEmail: revise }, prompts: {} } as never,
      {
        meeting: MEETING,
        subject: "Suite à notre échange",
        body: "Bonjour Madame Martin,\n\nMerci pour cet échange.",
        instruction: "Plus court",
      },
    );
    expect(out.subject).toBe("Notre rendez-vous de mardi");
    const call = (revise.mock.calls[0] as unknown[])[0] as {
      userContent: string;
      model: string;
    };
    expect(call.model).toBe("anthropic/claude-haiku-5.5");
    expect(call.userContent).toContain("Objet : Suite à notre échange");
    expect(call.userContent).toContain("<demande>\nPlus court\n</demande>");
    expect(call.userContent).toContain("on se revoit mardi à dix heures");
  });

  it("refuse une réponse vide du modèle", async () => {
    const revise = jest.fn(async () => ({ subject: "", body: "" }));
    await expect(
      reviseFollowUpEmail(
        { analysis: { reviseFollowUpEmail: revise }, prompts: {} } as never,
        {
          meeting: MEETING,
          subject: "Objet",
          body: "Corps",
          instruction: "Plus formel",
        },
      ),
    ).rejects.toThrow();
  });
});
