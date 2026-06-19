const TEXT_EXTENSIONS = [".txt", ".vtt", ".srt", ".md"];

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

export function extractTranscriptFromUpload(input: {
  filename: string;
  bytes: Buffer;
}): string {
  const lower = input.filename.toLowerCase();
  const isText = TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!isText) {
    throw new Error("UNSUPPORTED_FORMAT");
  }
  const text = input.bytes.toString("utf8").trim();
  if (text.length < 20) {
    throw new Error("TRANSCRIPT_TOO_SHORT");
  }
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
