import { describe, expect, it } from "@jest/globals";
import type { OrgDashboardHome } from "./get-org-dashboard-home";
import {
  buildKissTeamRollupFromMeetings,
  buildMonEquipePage,
  buildOrgAdminImprovementBullets,
  buildOrgAdminProgressBullets,
} from "./get-org-admin-dashboard";
import type { OrgAdminMonEquipeRankedRow } from "./get-org-admin-dashboard";
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

function membre(userId: string) {
  return {
    membershipId: `m-${userId}`,
    userId,
    email: `${userId}@test.fr`,
    firstName: userId.toUpperCase(),
    lastName: "Test",
  };
}

function rdv(
  sellerUserId: string,
  over: {
    salesScore?: number | null;
    hasKiss?: boolean;
    durationMin?: number | null;
  } = {},
): RecentMeetingListRow {
  return {
    sellerUserId,
    salesScore: over.salesScore ?? null,
    hasKiss: over.hasKiss ?? false,
    durationMin: over.durationMin ?? 30,
    latestSoncasResult: { dominant: "securite" },
  } as RecentMeetingListRow;
}

function ligne(page: { rows: OrgAdminMonEquipeRankedRow[] }, userId: string) {
  return page.rows.find((r) => r.userId === userId);
}

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

  it("compte les rendez-vous notés à part des rendez-vous coachés", () => {
    // Un rendez-vous coaché n'est pas toujours noté : le coaching vient de
    // l'analyse KISS, la note de l'analyse SONCAS. Les deux compteurs sont
    // affichés côte à côte dans le tableau, ils doivent rester réconciliables.
    const page = buildMonEquipePage({
      members: [membre("u1")],
      meetings: [
        rdv("u1", { salesScore: 80, hasKiss: true }),
        rdv("u1", { salesScore: null, hasKiss: true }),
        rdv("u1", { salesScore: 60, hasKiss: false }),
      ],
      page: 1,
    });

    expect(page.rows[0]?.coachesCount).toBe(2);
    expect(page.rows[0]?.scoredMeetings).toBe(2);
  });

  it("expose le résumé du classement au bandeau de lecture", () => {
    const page = buildMonEquipePage({
      members: [membre("u1"), membre("u2"), membre("u3"), membre("u4")],
      meetings: [
        // u1 : 3 notes, classé, moyenne 4
        rdv("u1", { salesScore: 80 }),
        rdv("u1", { salesScore: 80 }),
        rdv("u1", { salesScore: 80 }),
        // u2 : 3 notes, classé, moyenne 3
        rdv("u2", { salesScore: 60 }),
        rdv("u2", { salesScore: 60 }),
        rdv("u2", { salesScore: 60 }),
        // u3 : 1 seule note, écarté faute de volume
        rdv("u3", { salesScore: 100 }),
        // u4 : un rendez-vous, aucune note, écarté faute de note
        rdv("u4", { salesScore: null, hasKiss: true }),
      ],
      page: 1,
    });

    expect(page.ranking.rankedCount).toBe(2);
    expect(page.ranking.unrankedCount).toBe(2);
    expect(page.ranking.unrankedLowVolumeCount).toBe(1);
    expect(page.ranking.unrankedNoScoreCount).toBe(1);
    expect(page.ranking.averageNoteOn5).toBe(3.5);
    expect(page.ranking.minScoredMeetings).toBe(3);
  });

  it("ne décerne ni rang ni palier en dessous du seuil, mais garde la note", () => {
    const page = buildMonEquipePage({
      members: [membre("u1"), membre("u2")],
      meetings: [
        rdv("u1", { salesScore: 100 }),
        rdv("u2", { salesScore: 80 }),
        rdv("u2", { salesScore: 80 }),
        rdv("u2", { salesScore: 80 }),
      ],
      page: 1,
    });

    // Les lignes sont triées par volume : on les retrouve par identifiant, pas
    // par position, sinon le test décrirait le tri et non la règle testée.
    const u1 = ligne(page, "u1");
    const u2 = ligne(page, "u2");
    expect(u1?.noteGlobaleOn5).toBe(5);
    expect(u1?.rank).toBeNull();
    expect(u1?.tier).toBeNull();
    expect(u1?.unrankedReason).toBe("volume-insuffisant");
    expect(u2?.rank).toBe(1);
    expect(u2?.tier?.id).toBe("diamant");
  });

  it("classe sur l'équipe entière avant de découper en pages", () => {
    // Le meilleur vendeur est en fin de liste, donc en page 2. Si le classement
    // était calculé après le découpage, il serait premier de sa page et la
    // page 1 sacrerait quelqu'un qui ne l'est pas.
    const members = Array.from({ length: 12 }, (_, i) =>
      membre(`u${String(i + 1).padStart(2, "0")}`),
    );
    const meetings = members.flatMap((m, i) =>
      Array.from({ length: 3 }, () =>
        rdv(m.userId, { salesScore: 20 + i * 5 }),
      ),
    );

    const page1 = buildMonEquipePage({ members, meetings, page: 1 });
    const page2 = buildMonEquipePage({ members, meetings, page: 2 });

    expect(page1.rows).toHaveLength(10);
    expect(page2.rows).toHaveLength(2);
    expect(ligne(page2, "u12")?.rank).toBe(1);
    expect(ligne(page1, "u01")?.rank).toBe(12);
    // Aucune page ne contient deux fois le même rang, ni un rang inventé.
    expect(Math.min(...page1.rows.map((r) => r.rank ?? 99))).toBe(3);
    expect(page2.ranking.rankedCount).toBe(12);
  });
});
