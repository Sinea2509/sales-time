import { describe, expect, it } from "@jest/globals";
import { averageSoncasDriverScores } from "./org-soncas-team-aggregate";

const driver = (score: number) => ({ score, evidence: [] as string[] });

describe("averageSoncasDriverScores", () => {
  it("returns null averages when input is empty or invalid", () => {
    const a = averageSoncasDriverScores([]);
    expect(Object.values(a).every((v) => v === null)).toBe(true);
    const b = averageSoncasDriverScores([{ foo: 1 }]);
    expect(Object.values(b).every((v) => v === null)).toBe(true);
  });

  it("averages the six SONCAS levers", () => {
    const one = {
      drivers: {
        securite: driver(10),
        orgueil: driver(20),
        nouveaute: driver(30),
        confort: driver(40),
        argent: driver(50),
        sympathie: driver(60),
      },
      dominant: "argent" as const,
      summary: "x",
    };
    const two = {
      drivers: {
        securite: driver(20),
        orgueil: driver(30),
        nouveaute: driver(40),
        confort: driver(50),
        argent: driver(60),
        sympathie: driver(70),
      },
      dominant: "sympathie" as const,
      summary: "y",
    };
    const out = averageSoncasDriverScores([one, two]);
    expect(out.securite).toBe(15);
    expect(out.orgueil).toBe(25);
    expect(out.nouveaute).toBe(35);
    expect(out.confort).toBe(45);
    expect(out.argent).toBe(55);
    expect(out.sympathie).toBe(65);
  });
});
