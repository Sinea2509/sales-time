import { describe, expect, it } from "@jest/globals";
import { analysisScoringOverview } from "./analysis-scoring-overview";
import {
  DEFAULT_SCORECARD_GRID,
  scorecardCriteria,
} from "@/src/core/domain/scorecard-grid";

describe("analysisScoringOverview", () => {
  it("décrit la grille à partir des constantes du produit", () => {
    const o = analysisScoringOverview("SCORECARD")!;
    expect(o.scoring[0]).toContain(
      `${scorecardCriteria(DEFAULT_SCORECARD_GRID).length} critères`,
    );
    const table = o.tables.find((t) => t.caption.startsWith("Le niveau"))!;
    expect(table.rows).toEqual([
      ["rien d'utile obtenu", "0", "1", "2"],
      ["information partielle", "1", "2", "3"],
      ["information exploitable", "2", "3", "4"],
    ]);
    const blocs = o.tables.find((t) => t.caption.startsWith("Les blocs"))!;
    expect(blocs.rows.map((r) => Number(r[1])).reduce((a, b) => a + b)).toBe(
      100,
    );
  });

  it("dit pour chaque analyse ce qu'elle laisse aux autres, sans recouvrement", () => {
    expect(analysisScoringOverview("SCORECARD")!.notHere.join(" ")).toContain(
      "KISS",
    );
    expect(analysisScoringOverview("KISS")!.notHere.join(" ")).toContain(
      "la grille",
    );
    expect(
      analysisScoringOverview("MEETING_DETAIL_SYNTHESIS")!.notHere.join(" "),
    ).toContain("analyse des objections");
  });

  it("n'a pas de fiche pour une analyse qui ne note rien", () => {
    expect(analysisScoringOverview("FOLLOW_UP_EMAIL")).toBeNull();
  });

  it("n'écrit aucun tiret cadratin", () => {
    for (const kind of [
      "SCORECARD",
      "KISS",
      "SONCAS",
      "DISC",
      "OBJECTIONS",
      "MEETING_DETAIL_SYNTHESIS",
    ] as const) {
      expect(JSON.stringify(analysisScoringOverview(kind))).not.toContain(
        String.fromCodePoint(0x2014),
      );
    }
  });
});
