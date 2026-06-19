import { describe, expect, it } from "@jest/globals";
import {
  composeFollowUpEmailDraft,
  formatFollowUpEmailBody,
  formatFollowUpEmailDraft,
  parseFollowUpEmailDraft,
} from "./format-follow-up-email-draft";
import type { FollowUpEmailResult } from "./follow-up-email-zod";

const email: FollowUpEmailResult = {
  subject: "Suite à notre échange",
  greeting: "Bonjour Marie,",
  painPoints: "Vous avez évoqué des délais.",
  proposedSolutions: "Notre offre répond à ce besoin.",
  nextSteps: "Je vous propose un point mardi.",
  closing: "Bien cordialement,\nJean",
};

describe("formatFollowUpEmailDraft", () => {
  it("composes subject and body into persisted draft", () => {
    const draft = formatFollowUpEmailDraft(email);
    expect(draft.startsWith("Objet : Suite à notre échange")).toBe(true);
    expect(draft).toContain("Bonjour Marie,");
    expect(parseFollowUpEmailDraft(draft)).toEqual({
      subject: email.subject,
      body: formatFollowUpEmailBody(email),
    });
  });

  it("round-trips custom subject and body", () => {
    const draft = composeFollowUpEmailDraft("Objet test", "Corps\ndeux lignes");
    expect(parseFollowUpEmailDraft(draft)).toEqual({
      subject: "Objet test",
      body: "Corps\ndeux lignes",
    });
  });

  it("returns empty fields for blank draft", () => {
    expect(parseFollowUpEmailDraft(null)).toEqual({ subject: "", body: "" });
    expect(parseFollowUpEmailDraft("   ")).toEqual({ subject: "", body: "" });
  });

  it("treats legacy drafts without subject line as body only", () => {
    expect(parseFollowUpEmailDraft("Bonjour,\nmerci.")).toEqual({
      subject: "",
      body: "Bonjour,\nmerci.",
    });
  });
});
