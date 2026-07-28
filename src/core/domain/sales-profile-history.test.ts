import { describe, expect, it } from "@jest/globals";
import {
  meetingAtSinceForWindows,
  salesProfileHistory,
  salesProfileHistoryFilledCount,
} from "./sales-profile-history";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

const kissBase = {
  keep: ["k"],
  improve: ["i"],
  stop: ["s"],
  start: ["t1", "t2", "t3"],
  goldenQuestion: "gq",
  coachingScore: 7,
  coachingScoreJustification: "j",
  summary: "summary text here",
};

/** Un rendez-vous noté à une date donnée, dont les six compétences valent `avg`. */
function rdv(dateIso: string, avg: number): RecentMeetingListRow {
  return {
    meetingAt: new Date(dateIso),
    latestKissResult: {
      ...kissBase,
      sellerSkills: {
        assertivite: avg,
        ecouteActive: avg,
        capitalSympathie: avg,
        argumentation: avg,
        objections: avg,
        nextSteps: avg,
      },
    },
  } as unknown as RecentMeetingListRow;
}

const NOW = new Date("2026-06-30T00:00:00.000Z");

describe("meetingAtSinceForWindows", () => {
  it("remonte de count * days jours", () => {
    const since = meetingAtSinceForWindows(30, 3, NOW);
    expect(since.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });
});

describe("salesProfileHistory", () => {
  it("range les périodes de la plus ancienne à la plus récente", () => {
    const points = salesProfileHistory(
      [
        rdv("2026-04-15T00:00:00.000Z", 30), // periode 0 : [04-01, 05-01)
        rdv("2026-05-15T00:00:00.000Z", 60), // periode 1 : [05-01, 05-31)
        rdv("2026-06-15T00:00:00.000Z", 90), // periode 2 : [05-31, 06-30)
        rdv("2026-06-20T00:00:00.000Z", 90), // periode 2 aussi
      ],
      30,
      3,
      NOW,
    );
    expect(points.map((p) => p.average)).toEqual([30, 60, 90]);
    expect(points.map((p) => p.rdvCount)).toEqual([1, 1, 2]);
  });

  it("rend une période vide en null, jamais en zéro", () => {
    const points = salesProfileHistory(
      [rdv("2026-06-15T00:00:00.000Z", 80)], // seulement la periode la plus récente
      30,
      3,
      NOW,
    );
    expect(points.map((p) => p.average)).toEqual([null, null, 80]);
    expect(points.map((p) => p.rdvCount)).toEqual([0, 0, 1]);
  });

  it("produit exactement periodCount points", () => {
    const points = salesProfileHistory([], 30, 6, NOW);
    expect(points).toHaveLength(6);
    expect(points.every((p) => p.average === null)).toBe(true);
  });

  it("arrondit la moyenne d'une période au plus proche, fraction faible vers le bas", () => {
    // 30 + 30 + 50 + 50 + 50 + 50 = 260, / 6 = 43,33 -> 43 (ceil donnerait 44)
    const mixed = {
      meetingAt: new Date("2026-06-15T00:00:00.000Z"),
      latestKissResult: {
        ...kissBase,
        sellerSkills: {
          assertivite: 30,
          ecouteActive: 30,
          capitalSympathie: 50,
          argumentation: 50,
          objections: 50,
          nextSteps: 50,
        },
      },
    } as unknown as RecentMeetingListRow;
    expect(salesProfileHistory([mixed], 30, 1, NOW)[0].average).toBe(43);
  });

  it("arrondit la moyenne d'une période au plus proche, fraction forte vers le haut", () => {
    // 60 * 5 + 35 = 335, / 6 = 55,83 -> 56 (floor donnerait 55)
    const mixed = {
      meetingAt: new Date("2026-06-15T00:00:00.000Z"),
      latestKissResult: {
        ...kissBase,
        sellerSkills: {
          assertivite: 60,
          ecouteActive: 60,
          capitalSympathie: 60,
          argumentation: 60,
          objections: 60,
          nextSteps: 35,
        },
      },
    } as unknown as RecentMeetingListRow;
    expect(salesProfileHistory([mixed], 30, 1, NOW)[0].average).toBe(56);
  });

  it("exclut un rendez-vous hors de la fenêtre couverte", () => {
    const points = salesProfileHistory(
      [rdv("2026-01-01T00:00:00.000Z", 50)], // bien avant les 3 dernières périodes
      30,
      3,
      NOW,
    );
    expect(points.every((p) => p.average === null)).toBe(true);
  });

  it("place un rendez-vous pile sur une frontière dans la seule période suivante", () => {
    // La frontière période 1 / période 2 tombe à NOW - 30 jours, soit le
    // 2026-05-31 : borne haute exclue d'un côté, borne basse incluse de l'autre,
    // jamais compté deux fois.
    const points = salesProfileHistory(
      [rdv("2026-05-31T00:00:00.000Z", 70)],
      30,
      3,
      NOW,
    );
    expect(points.map((p) => p.rdvCount)).toEqual([0, 0, 1]);
  });
});

describe("salesProfileHistoryFilledCount", () => {
  it("compte les périodes qui portent une note", () => {
    const points = salesProfileHistory(
      [
        rdv("2026-05-15T00:00:00.000Z", 60),
        rdv("2026-06-15T00:00:00.000Z", 90),
      ],
      30,
      3,
      NOW,
    );
    expect(salesProfileHistoryFilledCount(points)).toBe(2);
  });
});
