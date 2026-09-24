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
  meetingAt: new Date("2026-09-24T08:00:00.000Z"),
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

  it("date le rendez-vous en heure de Paris, pas en temps universel", () => {
    // 21 h 30 en temps universel : 23 h 30 à Paris, toujours le jeudi.
    expect(
      meetingContextBlock({
        ...meeting,
        meetingAt: new Date("2026-09-24T21:30:00.000Z"),
      }),
    ).toContain("meetingDate: jeudi 24 septembre 2026");
    // 22 h 30 en temps universel : déjà vendredi à Paris.
    expect(
      meetingContextBlock({
        ...meeting,
        meetingAt: new Date("2026-09-24T22:30:00.000Z"),
      }),
    ).toContain("meetingDate: vendredi 25 septembre 2026");
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
