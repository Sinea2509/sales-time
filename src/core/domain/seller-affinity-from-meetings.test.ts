import { describe, expect, it } from "@jest/globals";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";
import {
  aggregateDiscAffinityBarsFromMeetings,
  aggregateSoncasAffinityBarsFromMeetings,
  DISC_BAR_CLASS,
  DISC_HEX,
  DISC_PILL_CLASS,
  emptyDiscAffinityPlaceholder,
  emptySoncasAffinityPlaceholder,
  SONCAS_BAR_CLASS,
  SONCAS_HEX,
  SONCAS_PILL_CLASS,
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

const disc = (scores: { D: number; I: number; S: number; C: number }) => ({
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

  /*
    Les hex des camemberts et les classes des barres doivent nommer le même
    cran Tailwind : c'est toute la promesse « une couleur par profil, sur
    toutes les pages ». La table hex-vers-cran reprend la palette Tailwind v4,
    qui est un fait extérieur au produit, pas un choix à retester.
  */
  it("peint chaque profil du même cran en barre et en camembert", () => {
    const cranParHex: Record<string, string> = {
      "#dc2626": "red-600",
      "#f59e0b": "amber-500",
      "#059669": "emerald-600",
      "#2563eb": "blue-600",
      "#1d4ed8": "blue-700",
      "#d946ef": "fuchsia-500",
      "#047857": "emerald-700",
      "#06b6d4": "cyan-500",
      "#e11d48": "rose-600",
    };
    for (const key of Object.keys(DISC_HEX) as Array<keyof typeof DISC_HEX>) {
      expect(DISC_BAR_CLASS[key]).toBe(`bg-${cranParHex[DISC_HEX[key]]}`);
    }
    for (const key of Object.keys(SONCAS_HEX) as Array<
      keyof typeof SONCAS_HEX
    >) {
      expect(SONCAS_BAR_CLASS[key]).toBe(`bg-${cranParHex[SONCAS_HEX[key]]}`);
    }
  });

  it("ne peint aucun profil au violet de la marque", () => {
    const tout = [
      ...Object.values(DISC_BAR_CLASS),
      ...Object.values(SONCAS_BAR_CLASS),
      ...Object.values(DISC_PILL_CLASS),
      ...Object.values(SONCAS_PILL_CLASS),
      ...Object.values(DISC_HEX),
      ...Object.values(SONCAS_HEX),
    ].join(" ");
    expect(tout).not.toMatch(/violet|purple|indigo/);
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

  it("normalizes dominant DISC style to 100%", () => {
    const meetings = [
      row({ latestDiscResult: disc({ D: 100, I: 0, S: 0, C: 0 }) }),
    ];
    const d = aggregateDiscAffinityBarsFromMeetings(meetings).find(
      (b) => b.key === "D",
    );
    expect(d!.pct).toBe(100);
  });

  it("ignores invalid out-of-range DISC scores", () => {
    const meetings = [
      row({ latestDiscResult: disc({ D: -80, I: 0, S: 0, C: 0 }) }),
    ];
    expect(aggregateDiscAffinityBarsFromMeetings(meetings)).toEqual([]);
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

  it("breaks SONCAS pct ties with lexicographic key ordering", () => {
    const mk = (sec: number, org: number) => ({
      drivers: {
        securite: driver(sec),
        orgueil: driver(org),
        nouveaute: driver(0),
        confort: driver(0),
        argent: driver(0),
        sympathie: driver(0),
      },
      dominant: "securite" as const,
      summary: "",
    });
    const meetings = [
      row({ latestSoncasResult: mk(40, 60) }),
      row({ latestSoncasResult: mk(60, 40) }),
    ];
    const bars = aggregateSoncasAffinityBarsFromMeetings(meetings);
    expect(bars.find((b) => b.key === "securite")!.pct).toBe(50);
    expect(bars.find((b) => b.key === "orgueil")!.pct).toBe(50);
    expect(bars.findIndex((b) => b.key === "orgueil")).toBeLessThan(
      bars.findIndex((b) => b.key === "securite"),
    );
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
