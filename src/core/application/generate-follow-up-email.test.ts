import { DEFAULT_FOLLOW_UP_EMAIL_SYSTEM } from "@/lib/default-analysis-prompts";
import type { ResolvedFollowUpEmailPreferences } from "@/src/core/domain/follow-up-email-preferences";
import {
  generateFollowUpEmailForMeeting,
  meetingContextBlock,
} from "./generate-follow-up-email";

const meeting = {
  id: "m1",
  sellerUserId: "u1",
  personId: "p1",
  prospectName: "Claire Morel",
  prospectCompany: "Atelier Morel",
  meetingAt: new Date(2026, 8, 24, 10, 0),
  outcome: "FOLLOW_UP" as const,
  meetingType: "Découverte",
  pipelineStage: null,
  potentialAmount: null,
  feeling: null,
  status: "READY" as const,
  errorMessage: null,
  followUpEmailDraft: null,
  visitReportDraft: null,
  transcript: "Je vous envoie la proposition d'ici vendredi.",
  notes: null,
  updatedAt: new Date(),
  analyses: [],
};

const preferences: ResolvedFollowUpEmailPreferences = {
  emailTone: "formal",
  emailVouvoiement: true,
  emailSignature: null,
};

describe("meetingContextBlock", () => {
  it("donne la date du rendez-vous en toutes lettres, avec le jour de la semaine", () => {
    expect(meetingContextBlock(meeting)).toBe(
      [
        "<meeting>",
        "meetingDate: jeudi 24 septembre 2026",
        "prospectName: Claire Morel",
        "prospectCompany: Atelier Morel",
        "meetingType: Découverte",
        "</meeting>",
      ].join("\n"),
    );
  });

  it("garde le jour saisi pour un rendez-vous tard le soir", () => {
    /*
      Le formulaire envoie l'heure saisie sans fuseau, lue dans celui du
      serveur : la date s'écrit dans ce même fuseau, et 23 h 30 reste le jour
      saisi, quel que soit le fuseau de la machine qui lance le test.
    */
    const block = meetingContextBlock({
      ...meeting,
      meetingAt: new Date(2026, 8, 24, 23, 30),
    });
    expect(block).toContain("meetingDate: jeudi 24 septembre 2026");
  });

  it("omet l'entreprise et le type quand la fiche ne les donne pas", () => {
    const block = meetingContextBlock({
      ...meeting,
      prospectCompany: null,
      meetingType: null,
    });
    expect(block).not.toContain("prospectCompany");
    expect(block).not.toContain("meetingType");
  });
});

describe("generateFollowUpEmailForMeeting", () => {
  it("envoie la consigne d'origine et place la date du rendez-vous avant le transcript", async () => {
    const generateFollowUpEmail = jest.fn().mockResolvedValue({
      result: { subject: "Suite à notre rendez-vous" },
    });

    await generateFollowUpEmailForMeeting(
      {
        analysis: { generateFollowUpEmail } as never,
        prompts: {
          getCurrentVersion: jest.fn().mockResolvedValue(null),
          getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
        } as never,
      },
      { meeting, emailPreferences: preferences },
    );

    const call = generateFollowUpEmail.mock.calls[0][0];
    expect(call.systemMarkdown).toBe(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM);
    expect(
      call.userContent.startsWith(
        "<meeting>\nmeetingDate: jeudi 24 septembre 2026\n",
      ),
    ).toBe(true);
    expect(call.userContent.indexOf("<meeting>")).toBeLessThan(
      call.userContent.indexOf("<transcript>"),
    );
    expect(call.userContent).toContain("emailSignature: (none)");
  });
});
