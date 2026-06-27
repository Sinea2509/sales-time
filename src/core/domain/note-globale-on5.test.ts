import { describe, expect, it } from "@jest/globals";
import { noteGlobaleOn5FromSalesScores } from "./note-globale-on5";

describe("noteGlobaleOn5FromSalesScores", () => {
  it("returns null when no scores", () => {
    expect(noteGlobaleOn5FromSalesScores([])).toBeNull();
  });

  it("converts average sales score to /5 scale", () => {
    expect(noteGlobaleOn5FromSalesScores([80, 60])).toBe(3.5);
  });
});
