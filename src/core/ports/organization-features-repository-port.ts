import type { OrganizationFeatureId } from "@/src/core/domain/organization-features";

export interface OrganizationFeaturesRepositoryPort {
  /** Les fonctionnalités activées pour l'organisation, vide si elle n'existe pas. */
  listEnabledFeatures(organizationId: string): Promise<string[]>;

  setFeature(input: {
    organizationId: string;
    feature: OrganizationFeatureId;
    enabled: boolean;
  }): Promise<void>;
}
