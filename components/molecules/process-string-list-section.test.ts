import {
  resolveProcessStringListValues,
  trimProcessStringListValues,
} from "./process-string-list-section";

describe("process string list values", () => {
  it("trims item values and drops empty rows", () => {
    expect(
      trimProcessStringListValues([
        { id: "1", value: " Découverte " },
        { id: "2", value: "" },
        { id: "3", value: "   " },
      ]),
    ).toEqual(["Découverte"]);
  });

  it("includes an open add draft when resolving values", () => {
    expect(
      resolveProcessStringListValues(
        [{ id: "1", value: "Découverte" }],
        { draftOpen: true, draft: "  Démo  ", maxItems: 40 },
      ),
    ).toEqual(["Découverte", "Démo"]);
  });

  it("ignores an open add draft when the list is full", () => {
    expect(
      resolveProcessStringListValues(
        [{ id: "1", value: "Découverte" }],
        { draftOpen: true, draft: "Démo", maxItems: 1 },
      ),
    ).toEqual(["Découverte"]);
  });
});
