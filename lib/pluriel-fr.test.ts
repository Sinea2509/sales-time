import { describe, expect, it } from "@jest/globals";
import { plurielFr } from "./pluriel-fr";

describe("plurielFr", () => {
  it("keeps the singular at 1 and below", () => {
    expect(plurielFr(0, "point")).toBe("point");
    expect(plurielFr(1, "point")).toBe("point");
    expect(plurielFr(1.5, "point")).toBe("point");
  });

  it("switches to the plural from 2", () => {
    expect(plurielFr(2, "point")).toBe("points");
    expect(plurielFr(12, "point")).toBe("points");
  });

  it("reads the magnitude, so a fall pluralises like a rise", () => {
    expect(plurielFr(-1, "point")).toBe("point");
    expect(plurielFr(-3, "point")).toBe("points");
  });

  it("accepts an irregular plural", () => {
    expect(plurielFr(1, "pt", "pts")).toBe("pt");
    expect(plurielFr(4, "pt", "pts")).toBe("pts");
  });
});
