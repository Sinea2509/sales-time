import { describe, expect, it } from "@jest/globals";
import {
  buildOrganizationPlaybookMarkdown,
  emptyOrganizationPlaybookContext,
  emptyOrganizationPlaybookForm,
  isOrganizationPlaybookEmpty,
  organizationPlaybookContextFromRow,
  organizationPlaybookFromJson,
  organizationPlaybookFullFormSchema,
  organizationPlaybookJsonSchema,
  organizationPlaybookToJson,
} from "./organization-playbook";

const fullForm = () => ({
  offer: "Formations commerciales",
  idealCustomer: "PME industrielles de 20 à 200 personnes",
  differentiators: ["Coaching individuel inclus"],
  competitors: ["Concurrent A"],
  salesMethod: "Découverte, démonstration, engagement",
  qualificationCriteria: ["Budget validé"],
  pricingRules: "Pas de remise supérieure à 10 pour cent",
  redLines: ["Ne jamais promettre une date de mise en service"],
});

describe("organization-playbook : schémas", () => {
  it("accepte un formulaire complet et refuse un objet vide", () => {
    expect(
      organizationPlaybookFullFormSchema.safeParse(fullForm()).success,
    ).toBe(true);
    expect(organizationPlaybookFullFormSchema.safeParse({}).success).toBe(
      false,
    );
  });

  it("refuse un texte plus long que la limite", () => {
    const tooLong = { ...fullForm(), offer: "x".repeat(1501) };
    expect(organizationPlaybookFullFormSchema.safeParse(tooLong).success).toBe(
      false,
    );
  });

  it("refuse une liste plus longue que la limite", () => {
    const tooMany = {
      ...fullForm(),
      redLines: Array.from({ length: 13 }, (_, i) => `règle ${i}`),
    };
    expect(organizationPlaybookFullFormSchema.safeParse(tooMany).success).toBe(
      false,
    );
  });
});

describe("organization-playbook : lecture et écriture JSON", () => {
  it("construit un formulaire vide qui ne produit aucun JSON", () => {
    const empty = emptyOrganizationPlaybookForm();
    expect(organizationPlaybookToJson(empty)).toBeNull();
    expect(isOrganizationPlaybookEmpty(empty)).toBe(true);
    expect(isOrganizationPlaybookEmpty(null)).toBe(true);
  });

  it("relit null, un objet vide et un JSON invalide comme un formulaire vide", () => {
    const empty = emptyOrganizationPlaybookForm();
    expect(organizationPlaybookFromJson(null)).toEqual(empty);
    expect(organizationPlaybookFromJson(undefined)).toEqual(empty);
    expect(organizationPlaybookFromJson({})).toEqual(empty);
    expect(organizationPlaybookFromJson({ offer: 42 })).toEqual(empty);
  });

  it("nettoie les espaces et les entrées vides à la relecture", () => {
    const form = organizationPlaybookFromJson({
      offer: "  une offre  ",
      differentiators: ["  a  ", "", "   ", "b"],
    });
    expect(form.offer).toBe("une offre");
    expect(form.differentiators).toEqual(["a", "b"]);
    expect(form.idealCustomer).toBe("");
    expect(form.competitors).toEqual([]);
  });

  it("ignore les valeurs non textuelles dans une liste", () => {
    const form = organizationPlaybookFromJson({
      competitors: ["a", 7, null, { x: 1 }, "b"],
    });
    expect(form.competitors).toEqual(["a", "b"]);
  });

  it("relit un tableau ou une valeur primitive comme un formulaire vide", () => {
    const empty = emptyOrganizationPlaybookForm();
    expect(organizationPlaybookFromJson(["offer"])).toEqual(empty);
    expect(organizationPlaybookFromJson("offer")).toEqual(empty);
    expect(organizationPlaybookFromJson(7)).toEqual(empty);
  });

  it("n'abandonne pas tout le playbook pour un seul champ illisible", () => {
    const form = organizationPlaybookFromJson({
      offer: { pas: "une chaîne" },
      salesMethod: "Découverte puis engagement",
      redLines: ["Jamais de remise sans validation"],
    });
    expect(form.offer).toBe("");
    expect(form.salesMethod).toBe("Découverte puis engagement");
    expect(form.redLines).toEqual(["Jamais de remise sans validation"]);
  });

  it("borne les longueurs relues, pour que le bloc injecté reste connu", () => {
    const form = organizationPlaybookFromJson({
      offer: "o".repeat(2000),
      competitors: Array.from({ length: 20 }, (_, i) => `concurrent ${i}`),
      redLines: ["r".repeat(400)],
    });
    expect(form.offer).toHaveLength(1500);
    expect(form.competitors).toHaveLength(12);
    expect(form.competitors[11]).toBe("concurrent 11");
    expect(form.redLines[0]).toHaveLength(200);
  });

  it("écrit un JSON conforme au schéma de relecture", () => {
    const json = organizationPlaybookToJson(fullForm());
    expect(json).not.toBeNull();
    expect(organizationPlaybookJsonSchema.safeParse(json).success).toBe(true);
  });

  it("ne sérialise que les champs renseignés", () => {
    const form = emptyOrganizationPlaybookForm();
    form.offer = "  une offre  ";
    form.redLines = ["  une limite  ", "  "];
    expect(organizationPlaybookToJson(form)).toEqual({
      offer: "une offre",
      redLines: ["une limite"],
    });
    expect(isOrganizationPlaybookEmpty(form)).toBe(false);
  });

  it("considère vide un formulaire qui ne contient que des espaces", () => {
    const form = emptyOrganizationPlaybookForm();
    form.salesMethod = "   ";
    form.competitors = ["  ", ""];
    expect(organizationPlaybookToJson(form)).toBeNull();
    expect(isOrganizationPlaybookEmpty(form)).toBe(true);
  });

  it("fait un aller-retour fidèle sur un formulaire complet", () => {
    const form = { ...fullForm() };
    const json = organizationPlaybookToJson(form);
    expect(organizationPlaybookFromJson(json)).toEqual(form);
  });
});

describe("organization-playbook : contexte", () => {
  it("projette une ligne absente sur un contexte vide", () => {
    expect(organizationPlaybookContextFromRow(null)).toEqual(
      emptyOrganizationPlaybookContext(),
    );
    expect(organizationPlaybookContextFromRow(undefined)).toEqual(
      emptyOrganizationPlaybookContext(),
    );
  });

  it("projette une ligne de réglages en nettoyant les espaces", () => {
    const context = organizationPlaybookContextFromRow({
      companyName: "  Acme  ",
      industrySector: null,
      companyPitch: "  un pitch  ",
      objections: ["  trop cher  ", 3, ""],
      keyArguments: "pas un tableau",
      industryVocabulary: undefined,
    });
    expect(context.companyName).toBe("Acme");
    expect(context.industrySector).toBe("");
    expect(context.companyPitch).toBe("un pitch");
    expect(context.objections).toEqual(["trop cher"]);
    expect(context.keyArguments).toEqual([]);
    expect(context.industryVocabulary).toBe("");
  });
});

describe("organization-playbook : rendu markdown", () => {
  it("ne rend rien quand tout est vide", () => {
    expect(buildOrganizationPlaybookMarkdown(null, null)).toBe("");
    expect(
      buildOrganizationPlaybookMarkdown(
        emptyOrganizationPlaybookForm(),
        emptyOrganizationPlaybookContext(),
      ),
    ).toBe("");
  });

  it("rend uniquement les sections renseignées", () => {
    const form = emptyOrganizationPlaybookForm();
    form.offer = "Formations commerciales";
    const markdown = buildOrganizationPlaybookMarkdown(form, null);
    expect(markdown).toContain("## Playbook de l'organisation");
    expect(markdown).toContain("### Offre\n\nFormations commerciales");
    expect(markdown).not.toContain("### Identité");
    expect(markdown).not.toContain("### Client idéal");
    expect(markdown).not.toContain("### Lignes rouges");
  });

  it("rappelle au modèle que le transcript fait foi", () => {
    const form = emptyOrganizationPlaybookForm();
    form.offer = "Formations";
    expect(buildOrganizationPlaybookMarkdown(form, null)).toContain(
      "le transcript fait foi",
    );
  });

  it("rend l'identité à partir des seuls champs remplis", () => {
    const context = emptyOrganizationPlaybookContext();
    context.companyName = "Acme";
    context.averageDealSize = "12 000 euros";
    const markdown = buildOrganizationPlaybookMarkdown(null, context);
    expect(markdown).toContain("### Identité");
    expect(markdown).toContain("- Entreprise : Acme");
    expect(markdown).toContain("- Panier moyen : 12 000 euros");
    expect(markdown).not.toContain("- Secteur :");
  });

  it("rend les listes en puces", () => {
    const form = emptyOrganizationPlaybookForm();
    form.redLines = [
      "Jamais de remise sans validation",
      "Jamais de date ferme",
    ];
    const markdown = buildOrganizationPlaybookMarkdown(form, null);
    expect(markdown).toContain(
      "### Lignes rouges\n\n- Jamais de remise sans validation\n- Jamais de date ferme",
    );
  });

  it("reprend les champs de contexte que rien n'injectait auparavant", () => {
    const context = emptyOrganizationPlaybookContext();
    context.companyPitch = "Nous formons les commerciaux";
    context.objections = ["Trop cher"];
    context.keyArguments = ["Retour sur investissement en trois mois"];
    context.industryVocabulary = "RDV, R1, R2";
    const markdown = buildOrganizationPlaybookMarkdown(null, context);
    expect(markdown).toContain("### Pitch\n\nNous formons les commerciaux");
    expect(markdown).toContain("### Objections fréquentes\n\n- Trop cher");
    expect(markdown).toContain(
      "### Arguments clés\n\n- Retour sur investissement en trois mois",
    );
    expect(markdown).toContain("### Vocabulaire métier\n\nRDV, R1, R2");
  });

  it("ordonne les sections de l'identité vers le vocabulaire", () => {
    const context = organizationPlaybookContextFromRow({
      companyName: "Acme",
      companyPitch: "pitch",
      objections: ["objection"],
      keyArguments: ["argument"],
      industryVocabulary: "vocabulaire",
    });
    const markdown = buildOrganizationPlaybookMarkdown(fullForm(), context);
    const ordre = [
      "### Identité",
      "### Pitch",
      "### Offre",
      "### Client idéal",
      "### Différenciateurs",
      "### Concurrents fréquemment rencontrés",
      "### Méthode de vente attendue",
      "### Critères de qualification",
      "### Objections fréquentes",
      "### Arguments clés",
      "### Règles de prix et de remise",
      "### Lignes rouges",
      "### Vocabulaire métier",
    ];
    const positions = ordre.map((titre) => markdown.indexOf(titre));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("n'emploie jamais le tiret cadratin", () => {
    const context = organizationPlaybookContextFromRow({
      companyName: "Acme",
      companyPitch: "pitch",
    });
    const markdown = buildOrganizationPlaybookMarkdown(fullForm(), context);
    expect(markdown).not.toContain("—");
  });
});
