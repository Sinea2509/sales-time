import { describe, expect, it } from "@jest/globals";
import {
  extractTextTranscript,
  hasTextTranscriptExtension,
  mergeMeetingTranscriptSources,
} from "./transcript-extract";

describe("mergeMeetingTranscriptSources", () => {
  it("prefers file then pasted complement", () => {
    expect(mergeMeetingTranscriptSources("from file", "extra notes")).toBe(
      "from file\n\n---\n\nextra notes",
    );
  });

  it("returns whichever side is present", () => {
    expect(mergeMeetingTranscriptSources("", "paste only")).toBe("paste only");
    expect(mergeMeetingTranscriptSources("file only", "")).toBe("file only");
  });
});

describe("hasTextTranscriptExtension", () => {
  it("recognizes text formats including csv", () => {
    expect(hasTextTranscriptExtension("a.txt")).toBe(true);
    expect(hasTextTranscriptExtension("a.CSV")).toBe(true);
    expect(hasTextTranscriptExtension("a.md")).toBe(true);
    expect(hasTextTranscriptExtension("a.pdf")).toBe(false);
    expect(hasTextTranscriptExtension("a.docx")).toBe(false);
  });
});

describe("extractTextTranscript", () => {
  it("extracts plain text from .txt files", () => {
    const text = "A".repeat(25);
    expect(
      extractTextTranscript({
        filename: "call.txt",
        bytes: Buffer.from(text, "utf8"),
      }),
    ).toBe(text);
  });

  it("reads .csv as text", () => {
    const csv = "speaker,line\nAlice,Bonjour à tous merci\nBob,Avec plaisir";
    expect(
      extractTextTranscript({ filename: "call.csv", bytes: Buffer.from(csv) }),
    ).toContain("Bonjour à tous");
  });

  it("strips VTT timestamps and headers", () => {
    const vtt = [
      "WEBVTT",
      "",
      "1",
      "00:00:01.000 --> 00:00:04.000",
      "Bonjour et bienvenue sur cet appel.",
      "",
      "2",
      "00:00:05.000 --> 00:00:08.000",
      "Merci beaucoup pour votre temps.",
    ].join("\n");

    const result = extractTextTranscript({
      filename: "call.vtt",
      bytes: Buffer.from(vtt, "utf8"),
    });

    expect(result).toContain("Bonjour et bienvenue");
    expect(result).toContain("Merci beaucoup");
    expect(result).not.toContain("WEBVTT");
    expect(result).not.toContain("-->");
  });

  it("throws UNSUPPORTED_FORMAT for non-text extensions", () => {
    expect(() =>
      extractTextTranscript({
        filename: "notes.pdf",
        bytes: Buffer.from("x".repeat(30)),
      }),
    ).toThrow("UNSUPPORTED_FORMAT");
  });

  it("throws TRANSCRIPT_TOO_SHORT when content is too small", () => {
    expect(() =>
      extractTextTranscript({
        filename: "short.txt",
        bytes: Buffer.from("too short", "utf8"),
      }),
    ).toThrow("TRANSCRIPT_TOO_SHORT");
  });
});
