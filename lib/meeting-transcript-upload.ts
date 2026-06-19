import { put } from "@vercel/blob";
import {
  blobPutOptions,
  isBlobConfigured,
  resolveBlobPutAuth,
} from "@/lib/blob-config";
import {
  buildOrgBlobPath,
  sanitizeBlobFilename,
} from "@/lib/blob-paths";
import { extractTranscriptFromUpload } from "@/lib/extract-transcript-from-upload";
import type { TranscriptExtractionError } from "@/lib/transcript-extract";

export type UploadMeetingTranscriptError = TranscriptExtractionError;

export type UploadMeetingTranscriptResult =
  | { ok: true; transcript: string; blobUrl: string }
  | { ok: false; error: UploadMeetingTranscriptError };

export async function uploadMeetingTranscriptFile(input: {
  organizationId: string;
  file: File;
}): Promise<UploadMeetingTranscriptResult> {
  const bytes = Buffer.from(await input.file.arrayBuffer());

  let transcript: string;
  try {
    transcript = await extractTranscriptFromUpload({
      filename: input.file.name,
      bytes,
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (
      code === "UNSUPPORTED_FORMAT" ||
      code === "TRANSCRIPT_TOO_SHORT" ||
      code === "EXTRACTION_FAILED"
    ) {
      return { ok: false, error: code };
    }
    throw err;
  }

  const auth = resolveBlobPutAuth();
  if (!auth) {
    return { ok: true, transcript, blobUrl: "" };
  }

  try {
    const pathname = buildOrgBlobPath(
      input.organizationId,
      "meetings/transcripts",
      `${Date.now()}-${sanitizeBlobFilename(input.file.name)}`,
    );
    const blob = await put(pathname, bytes, blobPutOptions(auth, { addRandomSuffix: true }));
    return { ok: true, transcript, blobUrl: blob.url };
  } catch (err) {
    console.error("uploadMeetingTranscriptFile", err);
    return { ok: true, transcript, blobUrl: "" };
  }
}

export function isMeetingTranscriptBlobConfigured(): boolean {
  return isBlobConfigured();
}
