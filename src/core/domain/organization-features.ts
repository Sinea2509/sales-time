/**
 * Les fonctionnalités réservées à certaines organisations. Le super admin les
 * active une à une ; une organisation n'en a aucune par défaut.
 *
 * Demande de Thomas du 23 octobre 2026 : les blocs Pipedrive de la méthode
 * SEED ne servent qu'à Sinéa. Les autres clients ne doivent pas les voir.
 */
export const ORGANIZATION_FEATURES = [
  {
    id: "pipedrive_blocks",
    label: "Blocs Pipedrive (méthode SEED)",
    description:
      "Un onglet Blocs Pipedrive sur chaque rendez-vous : Bloc SEED, Carte d'identité et Projet de formation, prêts à copier dans le CRM.",
  },
] as const;

export type OrganizationFeatureId =
  (typeof ORGANIZATION_FEATURES)[number]["id"];

export function isOrganizationFeatureId(
  value: string,
): value is OrganizationFeatureId {
  return ORGANIZATION_FEATURES.some((f) => f.id === value);
}

export function hasOrganizationFeature(
  enabled: readonly string[],
  feature: OrganizationFeatureId,
): boolean {
  return enabled.includes(feature);
}
