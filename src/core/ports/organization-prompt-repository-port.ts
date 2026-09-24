import type { OrganizationPromptKind } from "@/src/core/domain/organization-prompts";

/** Une ligne de l'historique des consignes d'une organisation. */
export type OrganizationPromptVersionRow = {
  id: string;
  organizationId: string;
  kind: OrganizationPromptKind;
  /** Le texte enregistré ; null pour une réinitialisation. */
  markdown: string | null;
  /** Null quand l'auteur a été supprimé depuis. */
  authorUserId: string | null;
  /** « Prénom Nom », à défaut l'adresse ; null quand l'auteur a été supprimé. */
  authorName: string | null;
  createdAt: Date;
};

/**
 * Les consignes par organisation (table `OrganizationPromptVersion`).
 *
 * Rien ne se modifie ni ne s'efface : chaque enregistrement et chaque
 * réinitialisation ajoutent une ligne, et la consigne en vigueur est la
 * dernière ligne de l'organisation pour le type.
 */
export interface OrganizationPromptRepositoryPort {
  /** La dernière ligne de l'organisation pour ce type, ou null s'il n'y en a pas. */
  findLatest(input: {
    organizationId: string;
    kind: OrganizationPromptKind;
  }): Promise<OrganizationPromptVersionRow | null>;

  /** La dernière ligne de chaque type qui en a une, pour l'écran. */
  listLatest(input: {
    organizationId: string;
  }): Promise<OrganizationPromptVersionRow[]>;

  /** Ajoute une ligne : un texte, ou null pour revenir à la consigne d'origine. */
  append(input: {
    organizationId: string;
    kind: OrganizationPromptKind;
    markdown: string | null;
    authorUserId: string;
  }): Promise<OrganizationPromptVersionRow>;
}
