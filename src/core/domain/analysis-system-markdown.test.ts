import {
  analysisSystemBlock,
  composeAnalysisSystemMarkdown,
  KISS_PLATFORM_BLOCK_HEADING,
} from "./analysis-system-markdown";

const SEP = "\n\n---\n\n";

describe("analysisSystemBlock", () => {
  it("titre le corps fourni", () => {
    expect(analysisSystemBlock("## Titre", "corps")).toBe("## Titre\n\ncorps");
  });

  it("rogne les espaces autour du corps", () => {
    expect(analysisSystemBlock("## Titre", "  corps  \n")).toBe(
      "## Titre\n\ncorps",
    );
  });

  it("ne rend rien quand le corps est vide", () => {
    expect(analysisSystemBlock("## Titre", "")).toBeNull();
    expect(analysisSystemBlock("## Titre", "   \t \n ")).toBeNull();
    expect(analysisSystemBlock("## Titre", null)).toBeNull();
    expect(analysisSystemBlock("## Titre", undefined)).toBeNull();
  });

  it("expose le titre des consignes KISS de la plateforme", () => {
    expect(KISS_PLATFORM_BLOCK_HEADING).toBe("## Consignes KISS (plateforme)");
  });
});

describe("composeAnalysisSystemMarkdown", () => {
  it("rend la base telle quelle sans aucun bloc", () => {
    expect(composeAnalysisSystemMarkdown("base", [])).toBe("base");
  });

  it("rend la base telle quelle quand tous les blocs sont vides", () => {
    expect(
      composeAnalysisSystemMarkdown("base", [null, undefined, "", "  \n\t "]),
    ).toBe("base");
  });

  it("ne rogne pas la base quand il n'y a rien à coller", () => {
    /*
      Sans playbook ni consignes, le prompt doit rester identique à celui
      envoyé avant l'existence du compositeur : aucune organisation ne doit
      voir ses analyses changer parce qu'elle n'a rien rempli.
    */
    expect(composeAnalysisSystemMarkdown("base\n\n", [])).toBe("base\n\n");
  });

  it("colle un bloc apres la base", () => {
    expect(composeAnalysisSystemMarkdown("base", ["bloc"])).toBe(
      `base${SEP}bloc`,
    );
  });

  it("colle les blocs dans l'ordre reçu", () => {
    expect(composeAnalysisSystemMarkdown("base", ["un", "deux"])).toBe(
      `base${SEP}un${SEP}deux`,
    );
  });

  it("ignore les blocs vides sans laisser de séparateur orphelin", () => {
    expect(
      composeAnalysisSystemMarkdown("base", [null, "un", "  ", "deux", ""]),
    ).toBe(`base${SEP}un${SEP}deux`);
  });

  it("rogne la base et les blocs quand il y a quelque chose à coller", () => {
    expect(composeAnalysisSystemMarkdown("  base \n\n", ["\n bloc \n"])).toBe(
      `base${SEP}bloc`,
    );
  });

  it("préserve les sauts de ligne internes des blocs", () => {
    const bloc = "### Offre\n\n- un\n- deux";
    expect(composeAnalysisSystemMarkdown("base", [bloc])).toBe(
      `base${SEP}${bloc}`,
    );
  });

  it("reproduit la concaténation KISS historique", () => {
    /*
      Forme exacte produite avant le compositeur, conservée pour que le prompt
      KISS envoyé au modèle reste identique octet pour octet.
    */
    const base = "prompt KISS";
    const appendix = "consigne plateforme";
    const attendu = `${base}\n\n---\n\n## Consignes KISS (plateforme)\n\n${appendix}`;
    expect(
      composeAnalysisSystemMarkdown(base, [
        analysisSystemBlock(KISS_PLATFORM_BLOCK_HEADING, appendix),
      ]),
    ).toBe(attendu);
  });

  it("n'introduit aucun tiret cadratin", () => {
    const rendu = composeAnalysisSystemMarkdown("base", [
      analysisSystemBlock(KISS_PLATFORM_BLOCK_HEADING, "consigne"),
      "## Playbook",
    ]);
    expect(rendu).not.toContain("—");
  });
});
