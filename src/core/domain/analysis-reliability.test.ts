import {
  analysisReliabilityFromWords,
  countWords,
} from "./analysis-reliability";

describe("analysisReliabilityFromWords", () => {
  it("suit les quatre paliers de la maquette", () => {
    expect(analysisReliabilityFromWords(100).level).toBe("insuffisante");
    expect(analysisReliabilityFromWords(250).level).toBe("faible");
    expect(analysisReliabilityFromWords(800).level).toBe("correcte");
    expect(analysisReliabilityFromWords(2000).level).toBe("bonne");
  });
});

describe("countWords", () => {
  it("compte les mots séparés par n'importe quel blanc", () => {
    expect(countWords("  un\tdeux\n trois  ")).toBe(3);
    expect(countWords("")).toBe(0);
  });
});
