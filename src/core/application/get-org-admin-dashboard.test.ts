import { describe, expect, it } from "@jest/globals";
import type { OrgDashboardHome } from "./get-org-dashboard-home";
import {
  buildKissTeamRollupFromMeetings,
  buildMonEquipePage,
  buildOrgAdminImprovementBullets,
  buildOrgAdminProgressBullets,
} from "./get-org-admin-dashboard";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

function baseHome(over: Partial<OrgDashboardHome> = {}): OrgDashboardHome {
  return {
    statsWindowDays: 30,
    tamMinutesPerRdv: 50,
    avgDurationMin: 12,
    usefulConversationMinutes: 120,
    tamCumuleMinutes: 120,
    nbRdvsRenseignes: 2,
    nbRdvs: 2,
    tucOptimisePercent: 50,
    tamTrendPercent: 10,
    tamCumuleTrendPercent: 8,
    nbRdvsTrendPercent: 5,
    nbRdvsRenseignesTrendPercent: 5,
    tucTrendPoints: 2,
    avgDurationTrendPercent: 10,
    noteGlobaleOn5: 4,
    noteGlobaleSampleCount: 2,
    noteGlobaleTrendPoints: 0.2,
    noteGlobaleTrendPercent: 5,
    recentMeetings: [],
    ...over,
  };
}

describe("buildOrgAdminProgressBullets", () => {
  it("includes tam trend when positive", () => {
    const bullets = buildOrgAdminProgressBullets(baseHome());
    expect(bullets.some((b) => b.includes("TAM en hausse"))).toBe(true);
  });

  it("falls back when no positive signals", () => {
    const bullets = buildOrgAdminProgressBullets(
      baseHome({
        tamCumuleTrendPercent: null,
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

describe("buildKissTeamRollupFromMeetings", () => {
  it("aggregates KISS bullet text instead of counts", () => {
    const row = {
      latestKissResult: {
        keep: ["Bien cadrer le besoin"],
        improve: ["Poser plus de questions ouvertes"],
        stop: ["Couper la parole"],
        start: ["Envoyer un récap sous 24 h"],
        goldenQuestion: "gq",
        coachingScore: 7,
        coachingScoreJustification: "j",
        summary: "summary",
      },
    } as RecentMeetingListRow;

    const rollup = buildKissTeamRollupFromMeetings([row]);
    expect(rollup.kissMeetingsCount).toBe(1);
    expect(rollup.keepBullets).toEqual(["Bien cadrer le besoin"]);
    expect(rollup.improveBullets).toEqual(["Poser plus de questions ouvertes"]);
    expect(rollup.stopBullets).toEqual(["Couper la parole"]);
    expect(rollup.startBullets).toEqual(["Envoyer un récap sous 24 h"]);
  });
});

describe("buildMonEquipePage", () => {
  it("computes note globale on 5 per seller from sales scores", () => {
    const page = buildMonEquipePage({
      members: [
        {
          membershipId: "m1",
          userId: "u1",
          email: "a@test.fr",
          firstName: "Alice",
          lastName: "A",
        },
      ],
      meetings: [
        {
          sellerUserId: "u1",
          salesScore: 80,
          hasKiss: true,
          durationMin: 30,
          latestSoncasResult: { dominant: "securite" },
        } as RecentMeetingListRow,
        {
          sellerUserId: "u1",
          salesScore: 60,
          hasKiss: false,
          durationMin: 20,
          latestSoncasResult: { dominant: "securite" },
        } as RecentMeetingListRow,
      ],
      page: 1,
    });

    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]?.noteGlobaleOn5).toBe(3.5);
    expect(page.rows[0]?.coachesCount).toBe(1);
  });
});
