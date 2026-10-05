import { describe, expect, it } from "@jest/globals";
import { markObjectionsVerbatim } from "./objections-verbatim";

const OBJECTION = {
  who: "Lisa",
  moment: null,
  response: "R",
  effect: "E",
  outcome: "partial" as const,
  suggestion: "« Q ? »",
};

describe("markObjectionsVerbatim", () => {
  it("garde comme citation une objection dite mot pour mot, et marque les autres", () => {
    const out = markObjectionsVerbatim(
      {
        summary: "",
        objections: [
          { ...OBJECTION, objection: "on n'a jamais fait ces prix-là" },
          {
            ...OBJECTION,
            objection:
              "Il faut que j'en parle à mon directeur avant de décider.",
          },
        ],
      },
      "Je sais pas parce que il y a un an, parce qu'on n'a jamais fait ces prix-là.",
    );
    expect(out.objections.map((o) => o.verbatim)).toEqual([true, false]);
  });
});
