import {
  analysisSystemBlock,
  composeAnalysisSystemMarkdown,
  KISS_PLATFORM_BLOCK_HEADING,
  ORGANIZATION_APPENDIX_HEADING,
  synthesisContextBlocks,
} from "./analysis-system-markdown";

const SEP = "\n\n---\n\n";

/**
 * Construit par point de code, jamais écrit.
 *
 * Le test de typographie balaie tout le dépôt et n'admet le caractère que dans
 * une courte liste de fichiers. Un test qui vérifie son absence n'a aucune
 * raison d'être la sixième exception : il lui suffit de ne pas le contenir.
 */
const TIRET_CADRATIN = String.fromCodePoint(0x2014);

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
    expect(rendu).not.toContain(TIRET_CADRATIN);
  });
});

describe("synthesisContextBlocks", () => {
  it("expose le titre déjà servi aux organisations", () => {
    /*
      Ce titre part dans le prompt de toute organisation qui a rempli ses
      consignes. Le changer changerait leurs textes sans rien leur apporter,
      la valeur est donc vérifiée mot pour mot.
    */
    expect(ORGANIZATION_APPENDIX_HEADING).toBe(
      "Consignes spécifiques fournies par l'organisation (à respecter si compatibles avec les données) :",
    );
  });

  it("ne rend aucun bloc sans consignes ni playbook", () => {
    expect(synthesisContextBlocks({})).toEqual([null, null]);
  });

  it("titre les consignes de l'organisation", () => {
    expect(
      synthesisContextBlocks({ organizationKissPromptAppendix: "consigne" }),
    ).toEqual([`${ORGANIZATION_APPENDIX_HEADING}\nconsigne`, null]);
  });

  it("rogne les consignes avant de les titrer", () => {
    expect(
      synthesisContextBlocks({
        organizationKissPromptAppendix: "\n  consigne  \n",
      }),
    ).toEqual([`${ORGANIZATION_APPENDIX_HEADING}\nconsigne`, null]);
  });

  it("ne titre rien quand les consignes sont vides", () => {
    for (const vide of ["", "   \n\t ", null, undefined]) {
      expect(
        synthesisContextBlocks({ organizationKissPromptAppendix: vide }),
      ).toEqual([null, null]);
    }
  });

  it("rend le playbook tel quel, sans titre ajouté", () => {
    /*
      Le playbook porte déjà ses propres titres markdown, écrits par
      `buildOrganizationPlaybookMarkdown`. En coiffer un de plus le rangerait
      d'un cran plus bas que sur le chemin par rendez-vous.
    */
    const playbook = "## Playbook\n\n### Offre\n\n- un";
    expect(
      synthesisContextBlocks({ organizationPlaybookMarkdown: playbook }),
    ).toEqual([null, playbook]);
  });

  it("normalise un playbook absent en null", () => {
    expect(
      synthesisContextBlocks({ organizationPlaybookMarkdown: undefined }),
    ).toEqual([null, null]);
  });

  it("place les consignes avant le playbook", () => {
    /*
      Le même ordre que `runMeetingAnalysis` sur le chemin par rendez-vous, pour
      qu'un lecteur d'`AiRequestLog` retrouve la même structure quel que soit le
      texte qu'il relit.
    */
    expect(
      synthesisContextBlocks({
        organizationKissPromptAppendix: "consigne",
        organizationPlaybookMarkdown: "## Playbook",
      }),
    ).toEqual([`${ORGANIZATION_APPENDIX_HEADING}\nconsigne`, "## Playbook"]);
  });

  it("reproduit la concaténation historique des consignes", () => {
    /*
      Forme exacte produite par `appendOrganizationKissPromptAppendix` avant sa
      suppression : base rognée, règle horizontale, titre, un seul saut de
      ligne, consignes rognées. Une organisation qui n'a rempli que ses
      consignes doit recevoir le prompt qu'elle recevait hier, à l'octet près.
    */
    const base = "prompt de synthèse\n\n";
    const consigne = "  parle en tutoyant  ";
    const attendu = `prompt de synthèse\n\n---\n\n${ORGANIZATION_APPENDIX_HEADING}\nparle en tutoyant`;
    expect(
      composeAnalysisSystemMarkdown(
        base,
        synthesisContextBlocks({ organizationKissPromptAppendix: consigne }),
      ),
    ).toBe(attendu);
  });

  it("laisse la base intacte quand rien n'est rempli", () => {
    const base = "prompt de synthèse\n\n";
    expect(
      composeAnalysisSystemMarkdown(base, synthesisContextBlocks({})),
    ).toBe(base);
  });
});
