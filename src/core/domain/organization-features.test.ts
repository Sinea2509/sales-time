import { describe, expect, it } from "@jest/globals";
import {
  ORGANIZATION_FEATURES,
  SINEA_ORGANIZATION_ID,
  hasOrganizationFeature,
  organizationMayHaveFeature,
} from "./organization-features";

const AUTRE_ORGANISATION = "autre-organisation";

describe("les fonctionnalités réservées", () => {
  it("ouvre les blocs Pipedrive à Sinéa quand l'option est cochée", () => {
    expect(
      hasOrganizationFeature(
        SINEA_ORGANIZATION_ID,
        ["pipedrive_blocks"],
        "pipedrive_blocks",
      ),
    ).toBe(true);
  });

  it("les garde fermés à Sinéa quand l'option ne l'est pas", () => {
    expect(
      hasOrganizationFeature(SINEA_ORGANIZATION_ID, [], "pipedrive_blocks"),
    ).toBe(false);
  });

  it("les garde fermés à toute autre organisation, même option cochée en base", () => {
    expect(
      hasOrganizationFeature(
        AUTRE_ORGANISATION,
        ["pipedrive_blocks"],
        "pipedrive_blocks",
      ),
    ).toBe(false);
  });

  it("n'autorise l'option que pour Sinéa", () => {
    expect(
      organizationMayHaveFeature(SINEA_ORGANIZATION_ID, "pipedrive_blocks"),
    ).toBe(true);
    expect(
      organizationMayHaveFeature(AUTRE_ORGANISATION, "pipedrive_blocks"),
    ).toBe(false);
  });

  it("ne laisse aucune fonctionnalité ouverte à tous", () => {
    for (const feature of ORGANIZATION_FEATURES) {
      expect(feature.reservedTo.length).toBeGreaterThan(0);
    }
  });
});
