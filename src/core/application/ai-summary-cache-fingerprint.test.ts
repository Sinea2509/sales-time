import { composeAnalysisSystemMarkdown } from "@/src/core/domain/analysis-system-markdown";
import { aiSummaryCacheFingerprint } from "./ai-summary-cache-fingerprint";

const RDV = "m1:DONE:2026-01-01T00:00:00.000Z";

function empreinte(
  promptContext: (string | null | undefined)[],
  meetingsFingerprint = RDV,
): string {
  return aiSummaryCacheFingerprint({ meetingsFingerprint, promptContext });
}

describe("aiSummaryCacheFingerprint", () => {
  it("rend l'empreinte des rendez-vous telle quelle sans aucun bloc", () => {
    /*
      Les lignes déjà en cache des organisations qui n'ont rempli ni consignes
      ni playbook restent lisibles : leur clé ne bouge pas d'un octet.
    */
    expect(empreinte([])).toBe(RDV);
  });

  it("rend l'empreinte des rendez-vous telle quelle quand tout est vide", () => {
    expect(empreinte([null, undefined, "", "  \n\t "])).toBe(RDV);
  });

  it("suffixe l'empreinte des rendez-vous quand un bloc est fourni", () => {
    expect(empreinte(["playbook"])).toMatch(
      new RegExp(`^${RDV}\\|ctx:[0-9a-f]{16}$`),
    );
  });

  it("rend la même valeur pour deux appels identiques", () => {
    expect(empreinte(["consignes", "playbook"])).toBe(
      empreinte(["consignes", "playbook"]),
    );
  });

  it("change quand le playbook change", () => {
    expect(empreinte(["playbook v1"])).not.toBe(empreinte(["playbook v2"]));
  });

  it("change quand les consignes changent, playbook constant", () => {
    expect(empreinte(["consignes v1", "playbook"])).not.toBe(
      empreinte(["consignes v2", "playbook"]),
    );
  });

  it("ne confond pas deux blocs voisins avec leur concaténation", () => {
    /*
      Sans la longueur annoncée devant chaque bloc, « ab » suivi de « c » et
      « a » suivi de « bc » se colleraient en « abc » et partageraient une
      ligne de cache, alors que les deux prompts diffèrent.
    */
    const empreintes = new Set([
      empreinte(["ab", "c"]),
      empreinte(["a", "bc"]),
      empreinte(["abc"]),
    ]);
    expect(empreintes.size).toBe(3);
  });

  it("distingue l'ordre des blocs", () => {
    expect(empreinte(["un", "deux"])).not.toBe(empreinte(["deux", "un"]));
  });

  it("ignore les espaces autour d'un bloc", () => {
    expect(empreinte(["  playbook \n"])).toBe(empreinte(["playbook"]));
  });

  it("ignore les blocs vides intercalés", () => {
    expect(empreinte([null, "un", "  ", "deux", ""])).toBe(
      empreinte(["un", "deux"]),
    );
  });

  it("sépare deux périodes de rendez-vous à contexte identique", () => {
    expect(empreinte(["playbook"], "fp-30")).not.toBe(
      empreinte(["playbook"], "fp-90"),
    );
  });

  it("garde l'empreinte des rendez-vous en préfixe lisible", () => {
    /*
      La partie rendez-vous reste en clair devant le condensé : un lecteur qui
      inspecte une ligne de `AiSummaryCache` retrouve la période résumée sans
      avoir à recalculer quoi que ce soit.
    */
    expect(empreinte(["playbook"]).startsWith(`${RDV}|`)).toBe(true);
  });

  it("partage une ligne de cache exactement quand le prompt est le même", () => {
    /*
      L'invariant que ce module doit tenir. Deux contextes qui produisent le
      même prompt système doivent relire le même texte, et deux contextes qui
      en produisent des prompts différents ne doivent jamais se confondre.
    */
    const contextes: (string | null | undefined)[][] = [
      [],
      [null, undefined, "", "   \n "],
      ["consignes"],
      ["  consignes  "],
      ["consignes", null],
      [null, "consignes"],
      ["consignes", "playbook"],
      ["playbook", "consignes"],
      ["ab"],
      ["a", "b"],
      ["ab", "c"],
      ["playbook"],
    ];
    for (const a of contextes) {
      for (const b of contextes) {
        const memePrompt =
          composeAnalysisSystemMarkdown("base", a) ===
          composeAnalysisSystemMarkdown("base", b);
        const memeEmpreinte = empreinte(a) === empreinte(b);
        expect([a, b, memeEmpreinte]).toEqual([a, b, memePrompt]);
      }
    }
  });

  it("sépare deux découpages qui se recollent en un seul prompt", () => {
    /*
      Limite connue et assumée. Un bloc qui contiendrait lui-même la règle
      horizontale du compositeur produirait le même prompt qu'un découpage en
      deux blocs, sans partager la ligne de cache. Le coût est un appel au
      modèle en trop, jamais un texte étranger servi à une organisation : la
      clé se trompe toujours du côté du calcul refait.
    */
    const enUnBloc = ["a\n\n---\n\nb"];
    const enDeuxBlocs = ["a", "b"];
    expect(composeAnalysisSystemMarkdown("base", enUnBloc)).toBe(
      composeAnalysisSystemMarkdown("base", enDeuxBlocs),
    );
    expect(empreinte(enUnBloc)).not.toBe(empreinte(enDeuxBlocs));
  });

  it("rend la valeur déjà écrite en base pour un contexte connu", () => {
    /*
      Valeur figée volontairement. Cette empreinte est une clé écrite en base :
      tout changement de codage, d'algorithme ou de longueur retenue rend
      illisibles les lignes de `AiSummaryCache` de toutes les organisations,
      qui repayent alors un appel au modèle. Ce test ne dit pas que la valeur
      est belle, il dit qu'on ne la change pas par accident. Les accents du
      bloc valent contrôle de l'encodage.
    */
    expect(
      empreinte([
        "Consignes : tutoie le lecteur.",
        "## Playbook\n\nMéthode « découverte élargie ».",
      ]),
    ).toBe(`${RDV}|ctx:75670580b4dc37a7`);
  });

  it("accepte un playbook plus long que la clé d'index", () => {
    /*
      Le triplet de `AiSummaryCache` porte un index unique, dont l'entrée est
      bornée. Recopier le playbook dans la clé aurait fait échouer l'insertion
      des organisations les plus bavardes ; le condensé la garde courte.
    */
    const playbook = "ligne de playbook.\n".repeat(500);
    const rendue = empreinte([playbook]);
    expect(rendue.length).toBe(RDV.length + "|ctx:".length + 16);
  });
});
