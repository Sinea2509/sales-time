import { describe, expect, it } from "@jest/globals";
import { fileMatchesAccept } from "@/lib/file-accept";

const ACCEPT = ".txt,.vtt,.srt,.md,text/plain";

describe("fileMatchesAccept", () => {
  it("matches by extension regardless of mime", () => {
    expect(fileMatchesAccept("call.vtt", "", ACCEPT)).toBe(true);
    expect(fileMatchesAccept("notes.MD", "application/octet-stream", ACCEPT)).toBe(
      true,
    );
  });

  it("matches by exact mime type", () => {
    expect(fileMatchesAccept("blob", "text/plain", ACCEPT)).toBe(true);
  });

  it("matches mime wildcards", () => {
    expect(fileMatchesAccept("clip.png", "image/png", "image/*")).toBe(true);
    expect(fileMatchesAccept("doc.pdf", "application/pdf", "image/*")).toBe(
      false,
    );
  });

  it("rejects unsupported files", () => {
    expect(fileMatchesAccept("slides.pptx", "application/vnd", ACCEPT)).toBe(
      false,
    );
  });

  it("accepts everything when accept is empty", () => {
    expect(fileMatchesAccept("anything.xyz", "", "")).toBe(true);
  });
});
