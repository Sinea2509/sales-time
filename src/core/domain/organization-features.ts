/**
 * Les fonctionnalités réservées à certaines organisations. Le super admin les
 * active une à une ; une organisation n'en a aucune par défaut.
 *
 * Demande de Thomas du 23 octobre 2026 : les blocs Pipedrive de la méthode
 * SEED ne servent qu'à Sinéa. Les autres clients ne doivent pas les voir.
 *
 * Une case cochée suffisait pourtant à les ouvrir à une autre organisation,
 * constaté le 30 octobre 2026. `reservedTo` ferme cette porte : hors de cette
 * liste, la fonctionnalité reste fermée, quoi que dise la base.
 */

/** Le même identifiant en production et sur la branche de développement. */
export const SINEA_ORGANIZATION_ID = "cmufka01w000404l5up3wgpex";

export const ORGANIZATION_FEATURES = [
  {
    id: "pipedrive_blocks",
    label: "Blocs Pipedrive (méthode SEED)",
    description:
      "Un onglet Blocs Pipedrive sur chaque rendez-vous : Bloc SEED, Carte d'identité et Projet de formation, prêts à copier dans le CRM.",
    reservedTo: [SINEA_ORGANIZATION_ID],
    reservedNotice: "Réservée à Sinéa.",
  },
] as const;

export type OrganizationFeatureId =
  (typeof ORGANIZATION_FEATURES)[number]["id"];

export function isOrganizationFeatureId(
  value: string,
): value is OrganizationFeatureId {
  return ORGANIZATION_FEATURES.some((f) => f.id === value);
}

/** Ce que la réservation d'une fonctionnalité permet à cette organisation. */
export function organizationMayHaveFeature(
  organizationId: string,
  feature: OrganizationFeatureId,
): boolean {
  const entry = ORGANIZATION_FEATURES.find((f) => f.id === feature);
  return entry?.reservedTo.some((id) => id === organizationId) ?? false;
}

export function hasOrganizationFeature(
  organizationId: string,
  enabled: readonly string[],
  feature: OrganizationFeatureId,
): boolean {
  return (
    organizationMayHaveFeature(organizationId, feature) &&
    enabled.includes(feature)
  );
}
