import { describe, expect, it } from "@jest/globals";
import {
  computeTeamDiscPie,
  computeTeamSoncasPie,
} from "./org-profile-distribution-pie";

const driver = (score: number) => ({ score, evidence: [] as string[] });

describe("org-profile-distribution-pie", () => {
  it("returns equal DISC slices when no valid analyses", () => {
    const pie = computeTeamDiscPie([]);
    expect(pie.isDefaultEqual).toBe(true);
    expect(pie.analyzedMeetings).toBe(0);
    expect(pie.values).toEqual({ D: 25, I: 25, S: 25, C: 25 });
  });

  it("returns team average DISC scores when analyses exist", () => {
    const pie = computeTeamDiscPie([
      { scores: { D: 40, I: 20, S: 20, C: 20 }, dominant: "D", evidence: [], summary: "a" },
      { scores: { D: 20, I: 40, S: 20, C: 20 }, dominant: "I", evidence: [], summary: "b" },
    ]);
    expect(pie.isDefaultEqual).toBe(false);
    expect(pie.analyzedMeetings).toBe(2);
    expect(pie.values).toEqual({ D: 30, I: 30, S: 20, C: 20 });
  });

  it("returns equal SONCAS slices when no valid analyses", () => {
    const pie = computeTeamSoncasPie([{ invalid: true }]);
    expect(pie.isDefaultEqual).toBe(true);
    expect(Object.values(pie.values).reduce((a, b) => a + b, 0)).toBe(100);
    expect(Object.values(pie.values).every((v) => v === 16 || v === 17)).toBe(true);
  });

  it("returns team average SONCAS driver scores", () => {
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
        securite: driver(30),
        orgueil: driver(30),
        nouveaute: driver(30),
        confort: driver(30),
        argent: driver(30),
        sympathie: driver(30),
      },
      dominant: "securite" as const,
      summary: "y",
    };
    const pie = computeTeamSoncasPie([one, two]);
    expect(pie.isDefaultEqual).toBe(false);
    expect(pie.analyzedMeetings).toBe(2);
    expect(pie.values.securite).toBe(10);
    expect(pie.values.sympathie).toBe(23);
    expect(Object.values(pie.values).reduce((a, b) => a + b, 0)).toBe(100);
  });
});
