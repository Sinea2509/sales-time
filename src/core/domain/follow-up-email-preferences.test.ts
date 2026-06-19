import { describe, expect, it } from "@jest/globals";
import { resolveFollowUpEmailPreferences } from "./follow-up-email-preferences";

describe("resolveFollowUpEmailPreferences", () => {
  it("uses organization defaults when membership overrides are unset", () => {
    expect(
      resolveFollowUpEmailPreferences({
        organization: {
          emailTone: "informal",
          emailVouvoiement: false,
          emailSignature: "Org sig",
        },
        membership: {
          emailTone: null,
          emailVouvoiement: null,
          emailSignature: null,
        },
      }),
    ).toEqual({
      emailTone: "informal",
      emailVouvoiement: false,
      emailSignature: "Org sig",
    });
  });

  it("prefers membership overrides over organization defaults", () => {
    expect(
      resolveFollowUpEmailPreferences({
        organization: {
          emailTone: "formal",
          emailVouvoiement: true,
          emailSignature: "Org sig",
        },
        membership: {
          emailTone: "informal",
          emailVouvoiement: false,
          emailSignature: "My sig",
        },
      }),
    ).toEqual({
      emailTone: "informal",
      emailVouvoiement: false,
      emailSignature: "My sig",
    });
  });
});
