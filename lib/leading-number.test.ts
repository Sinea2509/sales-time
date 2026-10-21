import { describe, expect, it } from "@jest/globals";
import { formatLeadingNumber, parseLeadingNumber } from "./leading-number";

describe("parseLeadingNumber", () => {
  it("lit un entier suivi d'une unité", () => {
    expect(parseLeadingNumber("62 %")).toEqual({
      prefix: "",
      value: 62,
      decimals: 0,
      suffix: " %",
    });
  });

  it("lit les milliers séparés par une espace insécable", () => {
    expect(parseLeadingNumber("1\u202f240 €")?.value).toBe(1240);
    expect(parseLeadingNumber("12 500")?.value).toBe(12500);
  });

  it("garde le nombre de décimales", () => {
    expect(parseLeadingNumber("3,45")).toEqual({
      prefix: "",
      value: 3.45,
      decimals: 2,
      suffix: "",
    });
  });

  it("lit un signe et un préfixe", () => {
    expect(parseLeadingNumber("+12 pts")).toMatchObject({
      prefix: "+",
      value: 12,
    });
    expect(parseLeadingNumber("-4")?.value).toBe(-4);
  });

  it("refuse un texte qui contient un second nombre", () => {
    expect(parseLeadingNumber("2 h 15")).toBeNull();
    expect(parseLeadingNumber("3,4 / 5")).toBeNull();
    expect(parseLeadingNumber("n. c.")).toBeNull();
  });
});

describe("formatLeadingNumber", () => {
  it("remet la valeur à la française, préfixe et suffixe compris", () => {
    const n = parseLeadingNumber("1 240 €")!;
    expect(formatLeadingNumber(n, 620).replace(/\s/gu, " ")).toBe("620 €");
    const d = parseLeadingNumber("3,45")!;
    expect(formatLeadingNumber(d, 1.5)).toBe("1,50");
  });
});
