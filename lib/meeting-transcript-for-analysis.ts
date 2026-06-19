import {
  extractTranscriptFromUpload,
  mergeMeetingTranscriptSources,
} from "@/lib/transcript-extract";
import { fetchOrgBlobBytes } from "@/lib/blob-access";
import type { MeetingSourceType } from "@/src/core/domain/meeting-status";

const MIN_TRANSCRIPT_CHARS = 20;

export async function resolveMeetingTranscriptForAnalysis(input: {
  organizationId: string;
  transcript: string;
  sourceBlobUrl: string | null;
  sourceType: MeetingSourceType;
}): Promise<string> {
  const stored = input.transcript.trim();
  if (stored.length >= MIN_TRANSCRIPT_CHARS) {
    return stored;
  }

  if (input.sourceType !== "UPLOAD" || !input.sourceBlobUrl?.trim()) {
    return stored;
  }

  const fromBlob = await fetchTranscriptTextFromOrgBlob({
    organizationId: input.organizationId,
    blobUrl: input.sourceBlobUrl,
  });
  if (!fromBlob) {
    return stored;
  }

  return mergeMeetingTranscriptSources(fromBlob, stored);
}

async function fetchTranscriptTextFromOrgBlob(input: {
  organizationId: string;
  blobUrl: string;
}): Promise<string | null> {
  const file = await fetchOrgBlobBytes(input);
  if (!file) {
    return null;
  }

  const pathname = new URL(input.blobUrl).pathname;
  const filename = decodeURIComponent(pathname.split("/").pop() ?? "transcript.txt");

  try {
    return extractTranscriptFromUpload({ filename, bytes: file.bytes });
  } catch {
    return null;
  }
}
