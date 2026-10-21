import { describe, expect, it } from "@jest/globals";
import { DATA_COLORS, levelColor } from "./data-palette";

describe("levelColor", () => {
  it("dit en retrait sous 60, moyen de 60 à 74, solide à partir de 75", () => {
    expect(levelColor(0)).toBe(DATA_COLORS.low);
    expect(levelColor(59)).toBe(DATA_COLORS.low);
    expect(levelColor(60)).toBe(DATA_COLORS.mid);
    expect(levelColor(74)).toBe(DATA_COLORS.mid);
    expect(levelColor(75)).toBe(DATA_COLORS.high);
    expect(levelColor(100)).toBe(DATA_COLORS.high);
  });
});
