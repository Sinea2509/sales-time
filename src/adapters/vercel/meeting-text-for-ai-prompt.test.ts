import { describe, expect, it } from "@jest/globals";
import {
  buildDelimitedMeetingUserContent,
  sanitizeMeetingTextForAi,
} from "./meeting-text-for-ai-prompt";

describe("sanitizeMeetingTextForAi", () => {
  it("removes zero-width and control characters", () => {
    const raw = "Hello\u200bWorld\uFEFF\t\n";
    expect(sanitizeMeetingTextForAi(raw)).toBe("HelloWorld\t\n");
  });
});

describe("buildDelimitedMeetingUserContent", () => {
  it("wraps transcript and optional notes in tags", () => {
    const out = buildDelimitedMeetingUserContent({
      transcript: "Bonjour",
      notes: "Suite",
    });
    expect(out).toContain("<transcript>");
    expect(out).toContain("Bonjour");
    expect(out).toContain("</transcript>");
    expect(out).toContain("<notes>");
    expect(out).toContain("Suite");
    expect(out).toContain("</notes>");
    expect(out).toContain("XML-tagged");
  });

  it("omits notes block when notes are null", () => {
    const out = buildDelimitedMeetingUserContent({
      transcript: "A",
      notes: null,
    });
    expect(out).toContain("<transcript>");
    expect(out).not.toMatch(/<notes>[\s\S]*<\/notes>/);
  });
});
