import { describe, expect, it } from "vitest";
import type { OrgDashboardHome } from "./get-org-dashboard-home";
import {
  buildOrgAdminImprovementBullets,
  buildOrgAdminProgressBullets,
} from "./get-org-admin-dashboard";

function baseHome(over: Partial<OrgDashboardHome> = {}): OrgDashboardHome {
  return {
    statsWindowDays: 30,
    tamCumuleEur: 100,
    nbRdvs: 2,
    tucOptimisePercent: 50,
    avgDurationMin: null,
    tamTrendPercent: 10,
    nbRdvsTrendPercent: 5,
    tucTrendPoints: 2,
    avgDurationTrendPercent: null,
    noteGlobaleOn5: 4,
    noteGlobaleTrendPoints: 0.2,
    recentMeetings: [],
    ...over,
  };
}

describe("buildOrgAdminProgressBullets", () => {
  it("includes tam trend when positive", () => {
    const bullets = buildOrgAdminProgressBullets(baseHome());
    expect(bullets.some((b) => b.includes("TAM estimé"))).toBe(true);
  });

  it("falls back when no positive signals", () => {
    const bullets = buildOrgAdminProgressBullets(
      baseHome({
        tamTrendPercent: null,
        nbRdvsTrendPercent: null,
        tucTrendPoints: null,
        noteGlobaleTrendPoints: null,
      }),
    );
    expect(bullets.length).toBeGreaterThan(0);
  });
});

describe("buildOrgAdminImprovementBullets", () => {
  it("suggests work when a lever is weak", () => {
    const bullets = buildOrgAdminImprovementBullets({
      securite: 40,
      orgueil: 80,
      nouveaute: 80,
      confort: 80,
      argent: 80,
      sympathie: 80,
    });
    expect(bullets.some((b) => b.includes("Sécurité"))).toBe(true);
  });
});
