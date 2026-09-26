import { DEFAULT_TRANSCRIPTION_MODEL } from "@/lib/analysis-gateway-models";
import {
  AUDIO_MAX_BYTES,
  isSupportedAudioMediaType,
} from "@/lib/audio-transcript";
import { isTranscriptAnalyzable } from "@/lib/transcript-extract";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";

export type TranscribeMeetingAudioError =
  | "AUDIO_NOT_FOUND"
  | "AUDIO_TOO_LARGE"
  | "UNSUPPORTED_FORMAT"
  | "TRANSCRIPTION_FAILED"
  | "TRANSCRIPT_TOO_SHORT_FOR_ANALYSIS";

export type TranscribeMeetingAudioResult =
  | { ok: true; transcript: string }
  | { ok: false; error: TranscribeMeetingAudioError; message?: string };

export type AudioFetcher = (input: {
  organizationId: string;
  blobUrl: string;
}) => Promise<{ bytes: Uint8Array; contentType: string } | null>;

/**
 * Transcrit l'enregistrement d'un rendez-vous déjà déposé dans le stockage
 * de l'organisation.
 *
 * Le fichier est relu depuis le stockage, jamais reçu du navigateur : une
 * requête vers le serveur est plafonnée à quelques mégaoctets, un
 * enregistrement d'une demi-heure en pèse vingt. Le transcript obtenu doit
 * être assez long pour être analysé, comme un transcript collé.
 */
export async function transcribeMeetingAudio(
  deps: {
    analysis: AnalysisPort;
    fetchAudio: AudioFetcher;
    model?: string;
  },
  input: { organizationId: string; blobUrl: string; mediaType: string },
): Promise<TranscribeMeetingAudioResult> {
  if (!isSupportedAudioMediaType(input.mediaType)) {
    return { ok: false, error: "UNSUPPORTED_FORMAT" };
  }

  const file = await deps.fetchAudio({
    organizationId: input.organizationId,
    blobUrl: input.blobUrl,
  });
  if (!file) return { ok: false, error: "AUDIO_NOT_FOUND" };
  if (file.bytes.byteLength > AUDIO_MAX_BYTES) {
    return { ok: false, error: "AUDIO_TOO_LARGE" };
  }

  let text: string;
  try {
    const out = await deps.analysis.transcribeAudio({
      audio: file.bytes,
      mediaType: input.mediaType,
      model: deps.model ?? DEFAULT_TRANSCRIPTION_MODEL,
    });
    text = out.text.trim();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: "TRANSCRIPTION_FAILED", message };
  }

  if (!isTranscriptAnalyzable(text)) {
    return { ok: false, error: "TRANSCRIPT_TOO_SHORT_FOR_ANALYSIS" };
  }

  return { ok: true, transcript: text };
}
