import type { OrganizationPromptCard } from "@/src/core/application/organization-prompt-settings";
import { APP_TIME_ZONE } from "@/src/core/domain/app-time-zone";
import {
  ORGANIZATION_PROMPT_TITLES,
  type OrganizationPromptKind,
} from "@/src/core/domain/organization-prompts";
import { PROFILE_SCORE_UNPROVEN_MAX } from "@/src/core/domain/profile-score-scale";
import {
  DEFAULT_SCORECARD_GRID,
  SCORECARD_LEVEL_MAX,
  scorecardCriteria,
} from "@/src/core/domain/scorecard-grid";

/**
 * Ce que dit chaque carte de Paramètres, Coach IA.
 *
 * Les nombres viennent des règles qu'ils décrivent, et non d'une copie : une
 * grille qui gagnerait un critère, ou un seuil de preuve qui bougerait,
 * changeraient la carte avec eux.
 *
 * DISC s'écarte de la maquette, qui lui prêtait « ses propres preuves » par
 * style et « la même règle que SONCAS ». Le schéma DISC n'a qu'une liste de
 * preuves pour les quatre styles, et aucune règle du produit ne ramène un
 * style annoncé sans appui : la carte ne promet que ce que la consigne exige.
 */
export const ORGANIZATION_PROMPT_DESCRIPTIONS: Record<
  OrganizationPromptKind,
  string
> = {
  SCORECARD: `${scorecardCriteria(DEFAULT_SCORECARD_GRID).length} critères en ${DEFAULT_SCORECARD_GRID.blocks.length} blocs, niveaux 0 à ${SCORECARD_LEVEL_MAX}. La grille, l'échelle des niveaux et la règle de preuve sont ajoutées par le produit et ne s'éditent pas ici.`,
  SONCAS: `Six leviers notés sur 100, citations obligatoires au-dessus de ${PROFILE_SCORE_UNPROVEN_MAX}. L'échelle de preuves est ajoutée automatiquement.`,
  DISC: `Quatre styles notés sur 100, indépendants. Au-dessus de ${PROFILE_SCORE_UNPROVEN_MAX}, un style s'appuie sur un comportement ou une phrase du prospect. L'échelle est ajoutée automatiquement.`,
  KISS: "Ce qu'il faut garder, améliorer, arrêter et démarrer. Chaque puce s'appuie sur un moment du transcript et propose un geste pour le prochain rendez-vous.",
  MEETING_DETAIL_SYNTHESIS:
    "Le texte prêt à coller dans le CRM. Les sections sont imposées, et une rubrique sans information dans le transcript est signalée comme non abordée plutôt que complétée.",
  FOLLOW_UP_EMAIL:
    "Rédigé pour le prospect, dans le ton et l'adresse choisis dans l'onglet E-mail.",
};

/** Une carte prête à afficher : ses textes sont calculés côté serveur. */
export type OrganizationPromptCardView = {
  kind: OrganizationPromptKind;
  title: string;
  description: string;
  /** La consigne en vigueur, celle que la fenêtre ouvre. */
  markdown: string;
  modified: boolean;
  /** « Modifiée le 24 septembre 2026 », ou « Consigne d'origine, version 4 ». */
  badge: string;
  /** « Modifiée par Prénom Nom » ; null quand l'auteur n'est plus connu. */
  badgeTooltip: string | null;
};

const modifiedDate = new Intl.DateTimeFormat("fr-FR", {
  timeZone: APP_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** « 24 septembre 2026 », et « 1er octobre 2026 » le premier du mois. */
function longDate(date: Date): string {
  return modifiedDate
    .formatToParts(date)
    .map((part) =>
      part.type === "day" && part.value === "1" ? "1er" : part.value,
    )
    .join("");
}

export function organizationPromptCardView(
  card: OrganizationPromptCard,
): OrganizationPromptCardView {
  const base = {
    kind: card.kind,
    title: ORGANIZATION_PROMPT_TITLES[card.kind],
    description: ORGANIZATION_PROMPT_DESCRIPTIONS[card.kind],
    markdown: card.markdown,
  };
  if (card.modified) {
    return {
      ...base,
      modified: true,
      badge: `Modifiée le ${longDate(card.modified.at)}`,
      badgeTooltip: card.modified.authorName
        ? `Modifiée par ${card.modified.authorName}`
        : null,
    };
  }
  return {
    ...base,
    modified: false,
    badge:
      card.originVersion === null
        ? "Consigne d'origine"
        : `Consigne d'origine, version ${card.originVersion}`,
    badgeTooltip: null,
  };
}
