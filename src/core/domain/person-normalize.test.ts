import { describe, expect, it } from "@jest/globals";
import { normalizePersonDisplayKey } from "./person-normalize";

describe("normalizePersonDisplayKey", () => {
  it("trims, collapses spaces, lowercases", () => {
    expect(normalizePersonDisplayKey("  Jean   Dupont  ")).toBe("jean dupont");
  });
});
