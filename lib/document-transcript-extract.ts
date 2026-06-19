import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import WordExtractor from "word-extractor";
import { ensureTranscriptLength } from "@/lib/transcript-extract";

/** Binary document formats that require parsing before yielding text. */
export const DOCUMENT_TRANSCRIPT_EXTENSIONS = [".pdf", ".docx", ".doc"] as const;

export function hasDocumentTranscriptExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return DOCUMENT_TRANSCRIPT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Parses a binary document into transcript text. Parser failures surface as
 * `EXTRACTION_FAILED`; unknown extensions as `UNSUPPORTED_FORMAT`.
 */
export async function extractDocumentTranscript(input: {
  filename: string;
  bytes: Buffer;
}): Promise<string> {
  const lower = input.filename.toLowerCase();

  let raw: string;
  try {
    if (lower.endsWith(".pdf")) {
      raw = await extractPdfText(input.bytes);
    } else if (lower.endsWith(".docx")) {
      raw = await extractDocxText(input.bytes);
    } else if (lower.endsWith(".doc")) {
      raw = await extractDocText(input.bytes);
    } else {
      throw new Error("UNSUPPORTED_FORMAT");
    }
  } catch (err) {
    if (err instanceof Error && err.message === "UNSUPPORTED_FORMAT") {
      throw err;
    }
    throw new Error("EXTRACTION_FAILED", { cause: err });
  }

  return ensureTranscriptLength(raw);
}

async function extractPdfText(bytes: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

async function extractDocxText(bytes: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer: bytes });
  return value;
}

async function extractDocText(bytes: Buffer): Promise<string> {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(bytes);
  return doc.getBody();
}
