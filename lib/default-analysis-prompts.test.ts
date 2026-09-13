import { describe, expect, it } from "@jest/globals";
import {
  DEFAULT_KISS_MARKDOWN,
  DEFAULT_ORG_KISS_ROLLUP_MARKDOWN,
  DEFAULT_SELLER_AFFINITY_MARKDOWN,
  DEFAULT_SELLER_PERFORMANCE_MARKDOWN,
  DEFAULT_TEAM_COACHING_MARKDOWN,
} from "./default-analysis-prompts";

/**
 * Ces tests relisent le contrat de précision des cinq prompts de coaching :
 * un conseil doit citer le moment qui le fonde, se chiffrer quand les données
 * le permettent, et se terminer en action pour la suite, rendez-vous ou
 * période. Ils
 * gardent les clauses opérantes du texte, pas sa mise en forme, et ils ne
 * testent évidemment pas ce que le modèle en fera : ils empêchent seulement
 * qu'une réécriture retombe dans les conseils génériques que ces clauses
 * bannissent.
 */

describe("contrat de précision des prompts de coaching", () => {
  it("chaque prompt français vise la suite, rendez-vous ou période", () => {
    // Les prompts du commercial parlent au rendez-vous suivant ; celui de
    // l'équipe raisonne à la période, c'est son horizon naturel.
    expect(DEFAULT_SELLER_PERFORMANCE_MARKDOWN).toContain(
      "prochain rendez-vous",
    );
    expect(DEFAULT_SELLER_AFFINITY_MARKDOWN).toContain("prochain rendez-vous");
    expect(DEFAULT_ORG_KISS_ROLLUP_MARKDOWN).toContain("prochain rendez-vous");
    expect(DEFAULT_TEAM_COACHING_MARKDOWN).toContain("prochaine période");
  });

  it("chaque prompt français bannit le conseil bon pour n'importe qui", () => {
    expect(DEFAULT_SELLER_PERFORMANCE_MARKDOWN).toContain(
      "n'importe quel commercial",
    );
    expect(DEFAULT_TEAM_COACHING_MARKDOWN).toContain("n'importe quelle équipe");
    expect(DEFAULT_ORG_KISS_ROLLUP_MARKDOWN).toContain(
      "n'importe quelle équipe",
    );
    expect(DEFAULT_SELLER_AFFINITY_MARKDOWN).toContain("portraits généraux");
  });

  it("la performance et l'affinité exigent l'action à déclencheur", () => {
    expect(DEFAULT_SELLER_PERFORMANCE_MARKDOWN).toContain("déclencheur");
    expect(DEFAULT_SELLER_AFFINITY_MARKDOWN).toContain("déclencheur");
  });

  it("la garde contre l'invention de faits reste première partout", () => {
    /*
      La forme d'usage exacte, pas un fragment : « n'invente pas de termes »
      (une consigne de ton) contient aussi « 'invente pas », et un test qui
      s'en contenterait laisserait retirer la garde sur les faits sans rien
      voir.
    */
    expect(DEFAULT_SELLER_PERFORMANCE_MARKDOWN).toContain(
      "N'invente pas de faits",
    );
    expect(DEFAULT_SELLER_AFFINITY_MARKDOWN).toContain(
      "N'invente pas de faits",
    );
    expect(DEFAULT_TEAM_COACHING_MARKDOWN).toContain("N'invente pas de faits");
    expect(DEFAULT_ORG_KISS_ROLLUP_MARKDOWN).toContain(
      "N'invente pas de recommandations hors du JSON",
    );
  });

  it("le prompt KISS ancre chaque puce dans le transcript et vise la suite", () => {
    expect(DEFAULT_KISS_MARKDOWN).toContain("Anchor every bullet");
    expect(DEFAULT_KISS_MARKDOWN).toContain("next meeting");
    expect(DEFAULT_KISS_MARKDOWN).toContain("any seller in any meeting");
  });

  it("le prompt KISS demande une voix de coach, pas de preneur de notes", () => {
    expect(DEFAULT_KISS_MARKDOWN).toContain("the seller's coach, not a note");
    // Le geste concret : une question, une phrase, un exercice, utilisable au
    // prochain appel. Sans lui, la puce redevient une étiquette.
    expect(DEFAULT_KISS_MARKDOWN).toContain("the concrete move");
    expect(DEFAULT_KISS_MARKDOWN).toContain("is a label, not coaching");
  });
});
