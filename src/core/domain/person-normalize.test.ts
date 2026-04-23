import { describe, expect, it } from "vitest";
import { normalizePersonDisplayKey } from "./person-normalize";

describe("normalizePersonDisplayKey", () => {
  it("trims, collapses spaces, lowercases", () => {
    expect(normalizePersonDisplayKey("  Jean   Dupont  ")).toBe("jean dupont");
  });
});
