import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { resolveMeetingTranscriptForAnalysis } from "@/lib/meeting-transcript-for-analysis";

describe("resolveMeetingTranscriptForAnalysis", () => {
  const originalToken = process.env.BLOB_READ_WRITE_TOKEN;

  beforeEach(() => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalToken === undefined) {
      delete process.env.BLOB_READ_WRITE_TOKEN;
    } else {
      process.env.BLOB_READ_WRITE_TOKEN = originalToken;
    }
  });

  it("returns stored transcript when long enough", async () => {
    const transcript = "A".repeat(25);
    await expect(
      resolveMeetingTranscriptForAnalysis({
        organizationId: "org_1",
        transcript,
        sourceBlobUrl: "https://blob.example/orgs/org_1/file.txt",
        sourceType: "UPLOAD",
      }),
    ).resolves.toBe(transcript);
  });

  it("fetches from blob when stored transcript is empty and org matches", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      arrayBuffer: async () =>
        Buffer.from("Contenu transcript depuis blob fichier."),
      headers: { get: () => "text/plain" },
    } as unknown as Response);

    await expect(
      resolveMeetingTranscriptForAnalysis({
        organizationId: "org_1",
        transcript: "",
        sourceBlobUrl:
          "https://blob.example/orgs/org_1/meetings/transcripts/meeting.txt",
        sourceType: "UPLOAD",
      }),
    ).resolves.toBe("Contenu transcript depuis blob fichier.");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://blob.example/orgs/org_1/meetings/transcripts/meeting.txt",
      { cache: "no-store" },
    );
  });

  it("does not fetch blob content for another organization", async () => {
    const fetchMock = jest.spyOn(global, "fetch");

    await expect(
      resolveMeetingTranscriptForAnalysis({
        organizationId: "org_1",
        transcript: "",
        sourceBlobUrl:
          "https://blob.example/orgs/org_2/meetings/transcripts/meeting.txt",
        sourceType: "UPLOAD",
      }),
    ).resolves.toBe("");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not fetch for pasted transcripts without blob source", async () => {
    const fetchMock = jest.spyOn(global, "fetch");

    await expect(
      resolveMeetingTranscriptForAnalysis({
        organizationId: "org_1",
        transcript: "court",
        sourceBlobUrl: null,
        sourceType: "TRANSCRIPT",
      }),
    ).resolves.toBe("court");

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
