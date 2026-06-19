export const MIN_TRANSCRIPT_CHARS = 20;

/** Formats read directly as UTF-8 text (subtitles get timestamp stripping). */
export const TEXT_TRANSCRIPT_EXTENSIONS = [
  ".txt",
  ".csv",
  ".md",
  ".vtt",
  ".srt",
] as const;

export type TranscriptExtractionError =
  | "UNSUPPORTED_FORMAT"
  | "TRANSCRIPT_TOO_SHORT"
  | "EXTRACTION_FAILED";

/** Combines file extraction with optional pasted complement (upload form). */
export function mergeMeetingTranscriptSources(
  fromFile: string,
  pasted: string,
): string {
  const file = fromFile.trim();
  const paste = pasted.trim();
  if (file && paste) {
    return `${file}\n\n---\n\n${paste}`;
  }
  return paste || file;
}

export function hasTextTranscriptExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return TEXT_TRANSCRIPT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Trims and enforces the minimum length, throwing `TRANSCRIPT_TOO_SHORT`. */
export function ensureTranscriptLength(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < MIN_TRANSCRIPT_CHARS) {
    throw new Error("TRANSCRIPT_TOO_SHORT");
  }
  return trimmed;
}

export function extractTextTranscript(input: {
  filename: string;
  bytes: Buffer;
}): string {
  const lower = input.filename.toLowerCase();
  if (!hasTextTranscriptExtension(lower)) {
    throw new Error("UNSUPPORTED_FORMAT");
  }
  const text = ensureTranscriptLength(input.bytes.toString("utf8"));
  if (lower.endsWith(".vtt") || lower.endsWith(".srt")) {
    return stripSubtitleTimestamps(text);
  }
  return text;
}

function stripSubtitleTimestamps(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((line) => {
      const t = line.trim();
      if (!t) return false;
      if (/^\d+$/.test(t)) return false;
      if (/^\d{2}:\d{2}:\d{2}[,.]\d{3}\s-->/.test(t)) return false;
      if (t.startsWith("WEBVTT")) return false;
      return true;
    })
    .join("\n")
    .trim();
}
