import { describe, expect, it } from "@jest/globals";
import {
  DEFAULT_DISC_MARKDOWN,
  DEFAULT_FOLLOW_UP_EMAIL_SYSTEM,
  DEFAULT_KISS_MARKDOWN,
  DEFAULT_MEETING_DETAIL_SYNTHESIS_MARKDOWN,
  DEFAULT_ORG_KISS_ROLLUP_MARKDOWN,
  DEFAULT_SCORECARD_MARKDOWN,
  DEFAULT_SELLER_AFFINITY_MARKDOWN,
  DEFAULT_SELLER_PERFORMANCE_MARKDOWN,
  DEFAULT_SONCAS_MARKDOWN,
  DEFAULT_TEAM_COACHING_MARKDOWN,
  STYLE_SALES_TIME_MARKDOWN,
} from "./default-analysis-prompts";
import { visitReportExtractionSchema } from "@/src/core/domain/visit-report-zod";

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
    expect(DEFAULT_KISS_MARKDOWN).toContain("Ancre chaque puce");
    expect(DEFAULT_KISS_MARKDOWN).toContain("prochain rendez-vous");
    expect(DEFAULT_KISS_MARKDOWN).toContain(
      "n'importe quel commercial, dans n'importe quel rendez-vous",
    );
  });

  it("le prompt KISS demande une voix de coach allié, pas de preneur de notes", () => {
    expect(DEFAULT_KISS_MARKDOWN).toContain(
      "le coach du commercial et son allié, ni un preneur de notes ni un juge",
    );
    // La suggestion concrète : une question, une phrase, un exercice, utilisable
    // au prochain rendez-vous. Sans elle, la puce redevient une étiquette.
    expect(DEFAULT_KISS_MARKDOWN).toContain(
      "une question à poser, une phrase à dire, un exercice à essayer",
    );
    expect(DEFAULT_KISS_MARKDOWN).toContain(
      "est une étiquette, pas du coaching",
    );
  });
});

describe("les décisions des revues du 2 et du 8 septembre", () => {
  it("les quatre consignes d'analyse finissent sur les règles d'écriture de Sales Time", () => {
    for (const consigne of [
      DEFAULT_SONCAS_MARKDOWN,
      DEFAULT_DISC_MARKDOWN,
      DEFAULT_KISS_MARKDOWN,
      DEFAULT_SCORECARD_MARKDOWN,
    ]) {
      expect(consigne.endsWith(STYLE_SALES_TIME_MARKDOWN)).toBe(true);
    }
    expect(STYLE_SALES_TIME_MARKDOWN).toContain("verbe conjugué");
    expect(STYLE_SALES_TIME_MARKDOWN).toContain("nous vous suggérons de");
    expect(STYLE_SALES_TIME_MARKDOWN).toContain(
      "ne remplis pas un champ pour le remplir",
    );
  });

  it("le DISC lit la forme plutôt que le fond, et parle d'une tendance observée", () => {
    expect(DEFAULT_DISC_MARKDOWN).toContain("Lire la forme, pas le fond");
    expect(DEFAULT_DISC_MARKDOWN).toContain("pas un test de personnalité");
    expect(DEFAULT_DISC_MARKDOWN).toContain("jamais du « style dominant »");
  });

  it("la grille présente ses manques comme une marge de progrès, avec notre suggestion", () => {
    expect(DEFAULT_SCORECARD_MARKDOWN).toContain("« Où gagner des points »");
    expect(DEFAULT_SCORECARD_MARKDOWN).toContain("« Notre suggestion : »");
    expect(DEFAULT_SCORECARD_MARKDOWN).toContain(
      "elle dit pourquoi la question est posée, puis la pose",
    );
  });

  it("l'e-mail de suivi a un objet sobre et n'invente aucune date", () => {
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "un objet sobre et factuel",
    );
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain("en toutes lettres");
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "n'invente jamais une date",
    );
  });

  it("la consigne du compte rendu décrit chacun des champs que le schéma attend", () => {
    /*
      Le format de réponse est imposé par le schéma, mais c'est la consigne
      qui dit au modèle ce que chaque champ doit contenir. Un champ ajouté au
      schéma sans être décrit ici reviendrait vide, ou rempli au hasard.
    */
    for (const cle of Object.keys(visitReportExtractionSchema.shape)) {
      expect([
        cle,
        DEFAULT_MEETING_DETAIL_SYNTHESIS_MARKDOWN.includes(`**${cle}**`),
      ]).toEqual([cle, true]);
    }
    expect(DEFAULT_MEETING_DETAIL_SYNTHESIS_MARKDOWN).toContain(
      "La règle anti-invention",
    );
  });
});

describe("les corrections du premier essai en production", () => {
  /*
    Au premier essai, le mail de Claire Morel annonçait un rendez-vous le
    « vendredi 12 mai » : la date venait de l'exemple de la consigne, pas du
    transcript. Ces tests gardent les trois parades : aucune consigne ne donne
    une date précise à recopier, chacune dit que ses exemples montrent une
    forme, et le mail reprend les étapes que le premier essai avait oubliées.
  */
  const CONSIGNES_DU_TRANSCRIPT = {
    SONCAS: DEFAULT_SONCAS_MARKDOWN,
    DISC: DEFAULT_DISC_MARKDOWN,
    KISS: DEFAULT_KISS_MARKDOWN,
    SCORECARD: DEFAULT_SCORECARD_MARKDOWN,
    FOLLOW_UP_EMAIL: DEFAULT_FOLLOW_UP_EMAIL_SYSTEM,
    MEETING_DETAIL_SYNTHESIS: DEFAULT_MEETING_DETAIL_SYNTHESIS_MARKDOWN,
  };
  const DATE_PRECISE =
    /\b\d{1,2}(er)? (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i;

  it("aucune consigne ne donne une date précise qu'un modèle pourrait recopier", () => {
    for (const [type, consigne] of Object.entries(CONSIGNES_DU_TRANSCRIPT)) {
      expect([type, consigne.match(DATE_PRECISE)?.[0] ?? null]).toEqual([
        type,
        null,
      ]);
    }
  });

  it("chaque consigne dit que ses exemples montrent une forme, jamais un fait", () => {
    for (const [type, consigne] of Object.entries(CONSIGNES_DU_TRANSCRIPT)) {
      expect([type, consigne.includes("montrent une forme")]).toEqual([
        type,
        true,
      ]);
    }
    expect(
      STYLE_SALES_TIME_MARKDOWN.endsWith(
        "tout ce que tu écris vient du transcript.",
      ),
    ).toBe(true);
  });

  it("le mail garde la date telle que le transcript la donne", () => {
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "Si le transcript dit « d'ici vendredi », écris « d'ici vendredi », sans ajouter de quantième ni de mois.",
    );
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "n'en déduis aucune autre date",
    );
  });

  it("le mail reprend toutes les étapes convenues, et les écrit comme acquises", () => {
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "les échanges demandés pour préparer la suite",
    );
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain("pas au conditionnel");
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "recopie-les avec leurs chiffres et leurs échéances",
    );
  });

  it("le mail laisse à chacun ses engagements, et ne promet rien de plus", () => {
    /*
      Au deuxième essai, le mail faisait prendre au commercial une mise en
      relation que la prospect avait proposé de faire elle-même, et promettait
      de « garantir l'application des acquis », ce que l'offre décrite ne
      disait pas.
    */
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "Chaque étape garde la personne qui s'y est engagée.",
    );
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "le mail la lui rappelle et la lui demande",
    );
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "Ne promets aucun résultat, aucune garantie",
    );
  });

  it("le mail garde chaque date entière, et finit sans nom quand il n'y a pas de signature", () => {
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "avec toutes ses précisions, moment de la journée compris",
    );
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "sans aucun nom, même si le transcript donne celui du commercial",
    );
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain("pas « impactée »");
  });

  it("le mail ouvre sur la formule d'appel seule, et se passe de signature quand il n'y en a pas", () => {
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "la formule d'appel seule sur sa première ligne",
    );
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain(
      "Si aucune signature n'est fournie, termine par la formule de politesse seule",
    );
    expect(DEFAULT_FOLLOW_UP_EMAIL_SYSTEM).toContain("on n'« adresse » pas");
  });
});
