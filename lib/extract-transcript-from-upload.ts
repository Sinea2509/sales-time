import {
  extractDocumentTranscript,
  hasDocumentTranscriptExtension,
} from "@/lib/document-transcript-extract";
import {
  extractTextTranscript,
  hasTextTranscriptExtension,
} from "@/lib/transcript-extract";

/**
 * Routes an uploaded file to the right extractor by extension and returns its
 * transcript text. Throws `UNSUPPORTED_FORMAT`, `TRANSCRIPT_TOO_SHORT`, or
 * `EXTRACTION_FAILED` (see `TranscriptExtractionError`).
 */
export async function extractTranscriptFromUpload(input: {
  filename: string;
  bytes: Buffer;
}): Promise<string> {
  if (hasTextTranscriptExtension(input.filename)) {
    return extractTextTranscript(input);
  }
  if (hasDocumentTranscriptExtension(input.filename)) {
    return extractDocumentTranscript(input);
  }
  throw new Error("UNSUPPORTED_FORMAT");
}
