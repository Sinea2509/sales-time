import { put } from "@vercel/blob";
import { extractTranscriptFromUpload } from "@/lib/transcript-extract";

export async function uploadMeetingTranscriptFile(input: {
  file: File;
}): Promise<{ transcript: string; blobUrl: string }> {
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const transcript = extractTranscriptFromUpload({
    filename: input.file.name,
    bytes,
  });

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return { transcript, blobUrl: "" };
  }

  const blob = await put(
    `meetings/transcripts/${Date.now()}-${input.file.name}`,
    bytes,
    { access: "public", token },
  );

  return { transcript, blobUrl: blob.url };
}
