import { AUDIO_MAX_BYTES } from "@/lib/audio-transcript";
import { transcribeMeetingAudio } from "./transcribe-meeting-audio";

const LONG_TRANSCRIPT = "Commercial : bonjour. Prospect : bonjour. ".repeat(20);

function makeDeps(input: {
  file?: { bytes: Uint8Array; contentType: string } | null;
  text?: string;
  fail?: Error;
}) {
  const transcribeAudio = input.fail
    ? jest.fn().mockRejectedValue(input.fail)
    : jest.fn().mockResolvedValue({ text: input.text ?? LONG_TRANSCRIPT });
  return {
    deps: {
      analysis: { transcribeAudio },
      fetchAudio: jest
        .fn()
        .mockResolvedValue(
          input.file === undefined
            ? { bytes: new Uint8Array(1024), contentType: "audio/mp4" }
            : input.file,
        ),
    },
    transcribeAudio,
  };
}

const request = {
  organizationId: "org1",
  blobUrl: "https://blob.test/orgs/org1/meetings/audio/rdv.m4a",
  mediaType: "audio/mp4",
};

describe("transcribeMeetingAudio", () => {
  it("relit le fichier depuis le stockage et rend le transcript", async () => {
    const { deps, transcribeAudio } = makeDeps({});

    const result = await transcribeMeetingAudio(deps as never, request);

    expect(result).toEqual({ ok: true, transcript: LONG_TRANSCRIPT.trim() });
    expect(deps.fetchAudio).toHaveBeenCalledWith({
      organizationId: "org1",
      blobUrl: request.blobUrl,
    });
    expect(transcribeAudio).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaType: "audio/mp4",
        model: "google/gemini-2.5-flash",
      }),
    );
  });

  it("refuse un fichier trop lourd avant d'appeler le modèle", async () => {
    const { deps, transcribeAudio } = makeDeps({
      file: {
        bytes: new Uint8Array(AUDIO_MAX_BYTES + 1),
        contentType: "audio/mp4",
      },
    });

    const result = await transcribeMeetingAudio(deps as never, request);

    expect(result).toEqual({ ok: false, error: "AUDIO_TOO_LARGE" });
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it("dit l'absence du fichier plutôt que d'envoyer du vide", async () => {
    const { deps } = makeDeps({ file: null });
    expect(await transcribeMeetingAudio(deps as never, request)).toEqual({
      ok: false,
      error: "AUDIO_NOT_FOUND",
    });
  });

  it("n'accepte que de l'audio", async () => {
    const { deps, transcribeAudio } = makeDeps({});
    const result = await transcribeMeetingAudio(deps as never, {
      ...request,
      mediaType: "video/mp4",
    });
    expect(result).toEqual({ ok: false, error: "UNSUPPORTED_FORMAT" });
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  /*
    Un transcript trop court est traité comme un transcript collé trop court :
    la même règle, pour que l'analyse ne parte jamais sur trois mots.
  */
  it("rejette un transcript trop court pour être analysé", async () => {
    const { deps } = makeDeps({ text: "Bonjour." });
    expect(await transcribeMeetingAudio(deps as never, request)).toEqual({
      ok: false,
      error: "TRANSCRIPT_TOO_SHORT_FOR_ANALYSIS",
    });
  });

  it("rend l'échec du modèle avec son message", async () => {
    const { deps } = makeDeps({ fail: new Error("modèle indisponible") });
    expect(await transcribeMeetingAudio(deps as never, request)).toEqual({
      ok: false,
      error: "TRANSCRIPTION_FAILED",
      message: "modèle indisponible",
    });
  });
});
