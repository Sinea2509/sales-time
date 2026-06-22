import { meetingDetailSynthesisSchema } from "./meeting-detail-synthesis-zod";

describe("meetingDetailSynthesisSchema", () => {
  it("parses a valid payload", () => {
    const parsed = meetingDetailSynthesisSchema.safeParse({
      meetingSynthesis: "Le prospect a exprimé des réserves sur le délai.",
      interlocutorProfile:
        "Décideur prudent, axé sur la sécurité et les preuves concrètes.",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty strings", () => {
    const parsed = meetingDetailSynthesisSchema.safeParse({
      meetingSynthesis: "",
      interlocutorProfile: "Profil.",
    });
    expect(parsed.success).toBe(false);
  });
});
