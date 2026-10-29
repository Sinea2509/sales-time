import { referenceNamesInstruction } from "./reference-names";

describe("referenceNamesInstruction", () => {
  it("impose l'interlocuteur et l'entreprise saisis par le commercial", () => {
    const text = referenceNamesInstruction({
      prospectName: "Claire Morel",
      prospectCompany: "Menuiseries Vermont",
    });
    expect(text).toContain("- Interlocuteur : « Claire Morel »");
    expect(text).toContain("- Entreprise : « Menuiseries Vermont »");
    expect(text).toContain(
      "même quand le transcript les orthographie autrement",
    );
  });

  it("ne répète pas l'entreprise quand elle tient lieu d'interlocuteur", () => {
    const text = referenceNamesInstruction({
      prospectName: "Menuiseries Vermont",
      prospectCompany: "Menuiseries Vermont",
    });
    expect(text).toContain("- Interlocuteur : « Menuiseries Vermont »");
    expect(text).not.toContain("- Entreprise :");
  });

  it("n'impose rien sans nom saisi", () => {
    expect(
      referenceNamesInstruction({ prospectName: " ", prospectCompany: null }),
    ).toBeNull();
  });
});
