import { describe, expect, it } from "@jest/globals";
import {
  isTranscriptAnalyzable,
  MIN_ANALYZABLE_TRANSCRIPT_CHARS,
} from "./transcript-extract";

describe("isTranscriptAnalyzable", () => {
  it("rejects below minimum length", () => {
    expect(isTranscriptAnalyzable("x".repeat(MIN_ANALYZABLE_TRANSCRIPT_CHARS - 1))).toBe(
      false,
    );
  });

  it("accepts at minimum length", () => {
    expect(isTranscriptAnalyzable("x".repeat(MIN_ANALYZABLE_TRANSCRIPT_CHARS))).toBe(
      true,
    );
  });
});
