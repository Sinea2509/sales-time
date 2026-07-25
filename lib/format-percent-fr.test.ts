import { describe, expect, it } from "@jest/globals";
import { formatPercentFr } from "./format-percent-fr";

describe("formatPercentFr", () => {
  it("writes the decimal separator in French", () => {
    expect(formatPercentFr(62.5)).toContain("62,5");
    expect(formatPercentFr(62.5)).not.toContain(".");
  });

  it("puts a non-breaking space before the sign", () => {
    // U+00A0 : le signe ne doit jamais partir seul à la ligne suivante.
    expect(formatPercentFr(50)).toBe("50 %");
  });

  it("keeps whole numbers whole", () => {
    expect(formatPercentFr(100)).toBe("100 %");
    expect(formatPercentFr(0)).toBe("0 %");
  });
});
