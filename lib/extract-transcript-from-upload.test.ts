import { describe, expect, it } from "@jest/globals";
import { extractTranscriptFromUpload } from "./extract-transcript-from-upload";

describe("extractTranscriptFromUpload", () => {
  it("routes text files to the text extractor", async () => {
    const text = "Bonjour, ceci est un compte-rendu de rendez-vous.";
    await expect(
      extractTranscriptFromUpload({
        filename: "call.txt",
        bytes: Buffer.from(text, "utf8"),
      }),
    ).resolves.toBe(text);
  });

  it("rejects unknown extensions with UNSUPPORTED_FORMAT", async () => {
    await expect(
      extractTranscriptFromUpload({
        filename: "slides.pptx",
        bytes: Buffer.from("x".repeat(50)),
      }),
    ).rejects.toThrow("UNSUPPORTED_FORMAT");
  });

  it("surfaces parser failures on corrupt documents as EXTRACTION_FAILED", async () => {
    await expect(
      extractTranscriptFromUpload({
        filename: "broken.docx",
        bytes: Buffer.from("not a real docx archive"),
      }),
    ).rejects.toThrow("EXTRACTION_FAILED");
  });
});
