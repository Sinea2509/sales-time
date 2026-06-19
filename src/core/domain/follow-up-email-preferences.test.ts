import { describe, expect, it } from "@jest/globals";
import {
  personalFollowUpEmailOverridesFromForm,
  resolveFollowUpEmailPreferences,
} from "./follow-up-email-preferences";

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

  it("falls back to product defaults when org and membership are absent", () => {
    expect(
      resolveFollowUpEmailPreferences({
        organization: null,
        membership: null,
      }),
    ).toEqual({
      emailTone: "formal",
      emailVouvoiement: true,
      emailSignature: null,
    });
  });

  it("normalizes invalid organization tone to formal", () => {
    expect(
      resolveFollowUpEmailPreferences({
        organization: {
          emailTone: "casual",
          emailVouvoiement: true,
          emailSignature: null,
        },
        membership: null,
      }),
    ).toEqual({
      emailTone: "formal",
      emailVouvoiement: true,
      emailSignature: null,
    });
  });

  it("applies partial membership overrides only where set", () => {
    expect(
      resolveFollowUpEmailPreferences({
        organization: {
          emailTone: "formal",
          emailVouvoiement: true,
          emailSignature: "Org sig",
        },
        membership: {
          emailTone: null,
          emailVouvoiement: null,
          emailSignature: "My sig",
        },
      }),
    ).toEqual({
      emailTone: "formal",
      emailVouvoiement: true,
      emailSignature: "My sig",
    });
  });
});

describe("personalFollowUpEmailOverridesFromForm", () => {
  it("stores null overrides when form matches organization defaults", () => {
    expect(
      personalFollowUpEmailOverridesFromForm({
        organization: {
          emailTone: "formal",
          emailVouvoiement: true,
          emailSignature: "Org sig",
        },
        form: {
          emailTone: "formal",
          emailVouvoiement: true,
          emailSignature: "Org sig",
        },
      }),
    ).toEqual({
      emailTone: null,
      emailVouvoiement: null,
      emailSignature: null,
    });
  });

  it("persists only fields that differ from organization defaults", () => {
    expect(
      personalFollowUpEmailOverridesFromForm({
        organization: {
          emailTone: "formal",
          emailVouvoiement: true,
          emailSignature: "Org sig",
        },
        form: {
          emailTone: "informal",
          emailVouvoiement: true,
          emailSignature: "My sig",
        },
      }),
    ).toEqual({
      emailTone: "informal",
      emailVouvoiement: null,
      emailSignature: "My sig",
    });
  });
});
