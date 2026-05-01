import { describe, expect, it } from "@jest/globals";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";
import {
  aggregateDiscAffinityBarsFromMeetings,
  aggregateSoncasAffinityBarsFromMeetings,
  DISC_BAR_CLASS,
  emptyDiscAffinityPlaceholder,
  emptySoncasAffinityPlaceholder,
  SONCAS_BAR_CLASS,
} from "./seller-affinity-from-meetings";

const driver = (score: number) => ({ score, evidence: [] as string[] });

const soncas = {
  drivers: {
    securite: driver(10),
    orgueil: driver(20),
    nouveaute: driver(30),
    confort: driver(40),
    argent: driver(50),
    sympathie: driver(60),
  },
  dominant: "securite" as const,
  summary: "",
};

const disc = (scores: {
  D: number;
  I: number;
  S: number;
  C: number;
}) => ({
  scores,
  dominant: "D" as const,
  evidence: [] as string[],
  summary: "",
});

function row(partial: {
  latestDiscResult?: unknown;
  latestSoncasResult?: unknown;
}): RecentMeetingListRow {
  return partial as RecentMeetingListRow;
}

describe("seller-affinity-from-meetings", () => {
  it("exposes bar class maps", () => {
    expect(DISC_BAR_CLASS.D).toContain("bg-");
    expect(SONCAS_BAR_CLASS.securite).toContain("bg-");
  });

  it("returns empty aggregates when no valid analyses", () => {
    expect(aggregateDiscAffinityBarsFromMeetings([])).toEqual([]);
    expect(aggregateSoncasAffinityBarsFromMeetings([])).toEqual([]);
    expect(
      aggregateDiscAffinityBarsFromMeetings([
        row({ latestDiscResult: { bad: true } }),
      ]),
    ).toEqual([]);
  });

  it("aggregates DISC scores and sorts by pct", () => {
    const meetings = [
      row({ latestDiscResult: disc({ D: 100, I: 0, S: 0, C: 0 }) }),
      row({ latestDiscResult: disc({ D: 0, I: 100, S: 0, C: 0 }) }),
    ];
    const bars = aggregateDiscAffinityBarsFromMeetings(meetings);
    expect(bars.length).toBe(4);
    expect(bars[0]!.pct).toBeGreaterThanOrEqual(bars[1]!.pct);
  });

  it("aggregates SONCAS driver scores", () => {
    const meetings = [row({ latestSoncasResult: soncas })];
    const bars = aggregateSoncasAffinityBarsFromMeetings(meetings);
    expect(bars.length).toBe(6);
    expect(bars.every((b) => b.pct >= 0 && b.pct <= 100)).toBe(true);
  });

  it("clamps negative averages to 0 for DISC", () => {
    const meetings = [row({ latestDiscResult: disc({ D: -80, I: 0, S: 0, C: 0 }) })];
    const d = aggregateDiscAffinityBarsFromMeetings(meetings).find((b) => b.key === "D");
    expect(d!.pct).toBe(0);
  });

  it("clamps high DISC averages to 100", () => {
    const meetings = [row({ latestDiscResult: disc({ D: 300, I: 0, S: 0, C: 0 }) })];
    const d = aggregateDiscAffinityBarsFromMeetings(meetings).find((b) => b.key === "D");
    expect(d!.pct).toBe(100);
  });

  it("returns placeholder grids", () => {
    expect(emptyDiscAffinityPlaceholder()).toHaveLength(4);
    expect(emptySoncasAffinityPlaceholder()).toHaveLength(6);
  });

  it("skips invalid SONCAS rows when aggregating", () => {
    const meetings = [
      row({ latestSoncasResult: { invalid: true } }),
      row({ latestSoncasResult: soncas }),
    ];
    expect(aggregateSoncasAffinityBarsFromMeetings(meetings)).toHaveLength(6);
  });

  it("breaks DISC pct ties with lexicographic key ordering", () => {
    const meetings = [
      row({ latestDiscResult: disc({ D: 60, I: 40, S: 0, C: 0 }) }),
      row({ latestDiscResult: disc({ D: 40, I: 60, S: 0, C: 0 }) }),
    ];
    const bars = aggregateDiscAffinityBarsFromMeetings(meetings);
    expect(bars.find((b) => b.key === "D")!.pct).toBe(50);
    expect(bars.find((b) => b.key === "I")!.pct).toBe(50);
    const dIdx = bars.findIndex((b) => b.key === "D");
    const iIdx = bars.findIndex((b) => b.key === "I");
    expect(dIdx).toBeLessThan(iIdx);
  });
});
