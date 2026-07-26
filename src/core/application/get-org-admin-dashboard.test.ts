import { describe, expect, it } from "@jest/globals";
import type { OrgDashboardHome } from "./get-org-dashboard-home";
import {
  buildKissTeamRollupFromMeetings,
  buildMonEquipePage,
  buildOrgAdminImprovementBullets,
  buildOrgAdminProgressBullets,
  buildTeamMemberStanding,
} from "./get-org-admin-dashboard";
import type { OrgAdminMonEquipeRankedRow } from "./get-org-admin-dashboard";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

function baseHome(over: Partial<OrgDashboardHome> = {}): OrgDashboardHome {
  return {
    statsWindowDays: 30,
    tamMinutesPerRdv: 50,
    avgDurationMin: 12,
    usefulConversationMinutes: 120,
    prospectingMinutes: 240,
    // 50 min de gain administratif sur 2 RDV renseignés : le jeu d'essai tient
    // la même arithmétique que la production, sinon il enseigne un faux rapport.
    tamCumuleMinutes: 100,
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

    // On retrouve les lignes par identifiant, pas par position : ce test porte
    // sur le seuil de volume, pas sur l'ordre d'affichage.
    const u1 = ligne(page, "u1");
    const u2 = ligne(page, "u2");
    expect(u1?.noteGlobaleOn5).toBe(5);
    expect(u1?.rank).toBeNull();
    expect(u1?.tier).toBeNull();
    expect(u1?.unrankedReason).toBe("volume-insuffisant");
    expect(u2?.rank).toBe(1);
    expect(u2?.tier?.id).toBe("excellence");
  });

  it("classe sur l'équipe entière avant de découper en pages", () => {
    // Le meilleur vendeur est en fin de liste reçue. Si le classement était
    // calculé après le découpage, la page 2 recommencerait à 1 et sacrerait
    // quelqu'un que l'équipe entière place onzième.
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
    expect(page2.rows.map((r) => r.rank)).toEqual([11, 12]);
    expect(ligne(page1, "u12")?.rank).toBe(1);
    expect(ligne(page2, "u01")?.rank).toBe(12);
    expect(page2.ranking.rankedCount).toBe(12);
  });

  it("range les lignes dans l'ordre du classement, hors classement en fin", () => {
    // La première colonne du tableau s'appelle « Rang » : la liste doit la
    // suivre, sinon la colonne décrit un classement que l'œil ne lit pas.
    // Les identifiants portent la lettre qui les trierait autrement : le membre
    // sans note ouvre l'alphabet et tient le plus gros volume. S'il passe
    // devant celui qui n'attend que du volume, c'est que la raison du hors
    // classement n'a pas été lue.
    const members = [
      membre("cFaible"), // classé, dernier
      membre("aSansNote"), // aucun rendez-vous noté, mais 4 rendez-vous
      membre("dFort"), // classé, premier
      membre("zPeuDeVolume"), // noté une seule fois, sous le seuil
      membre("bMoyen"), // classé, deuxième
    ];
    const meetings = [
      ...Array.from({ length: 3 }, () => rdv("cFaible", { salesScore: 30 })),
      ...Array.from({ length: 3 }, () => rdv("dFort", { salesScore: 95 })),
      ...Array.from({ length: 3 }, () => rdv("bMoyen", { salesScore: 70 })),
      rdv("zPeuDeVolume", { salesScore: 90 }),
      ...Array.from({ length: 4 }, () => rdv("aSansNote")),
    ];

    const page = buildMonEquipePage({ members, meetings, page: 1 });

    expect(page.rows.map((r) => r.userId)).toEqual([
      "dFort",
      "bMoyen",
      "cFaible",
      "zPeuDeVolume",
      "aSansNote",
    ]);
    expect(page.rows.map((r) => r.rank)).toEqual([1, 2, 3, null, null]);
  });

  it("départage deux ex æquo par le volume de rendez-vous", () => {
    // Même note affichée, donc même rang. Passe devant celui qui a le plus de
    // matière derrière sa note. Les identifiants sont choisis pour que
    // l'alphabet dise l'inverse du volume : un tri par nom seul échouerait ici.
    const members = [membre("aPeu"), membre("zBeaucoup")];
    const meetings = [
      ...Array.from({ length: 3 }, () => rdv("aPeu", { salesScore: 80 })),
      ...Array.from({ length: 6 }, () => rdv("zBeaucoup", { salesScore: 80 })),
    ];

    const page = buildMonEquipePage({ members, meetings, page: 1 });

    expect(page.rows.map((r) => r.rank)).toEqual([1, 1]);
    expect(page.rows.map((r) => r.userId)).toEqual(["zBeaucoup", "aPeu"]);
  });
});

describe("buildTeamMemberStanding", () => {
  const members = Array.from({ length: 12 }, (_, i) =>
    membre(`u${String(i + 1).padStart(2, "0")}`),
  );
  const meetings = members.flatMap((m, i) =>
    Array.from({ length: 3 }, () => rdv(m.userId, { salesScore: 20 + i * 5 })),
  );

  it("annonce sur la fiche exactement le rang affiché dans le tableau", () => {
    // C'est la raison d'être de la fonction : le manager clique sur une ligne
    // qui dit « 3e » et doit lire « 3e » sur la fiche. Le test compare les deux
    // sorties membre par membre, y compris pour ceux qui sont en page 2.
    for (const m of members) {
      const page = buildMonEquipePage({
        members,
        meetings,
        page: members.indexOf(m) < 10 ? 1 : 2,
      });
      const standing = buildTeamMemberStanding({
        members,
        meetings,
        sellerUserId: m.userId,
      });
      const dansLeTableau = ligne(page, m.userId);
      if (!dansLeTableau) continue;
      expect(standing.row?.rank).toBe(dansLeTableau.rank);
      expect(standing.row?.tier?.id ?? null).toBe(
        dansLeTableau.tier?.id ?? null,
      );
      expect(standing.row?.noteGlobaleOn5).toBe(dansLeTableau.noteGlobaleOn5);
      expect(standing.row?.deltaToTeamAverage).toBe(
        dansLeTableau.deltaToTeamAverage,
      );
    }
  });

  it("expose le même résumé de classement que le tableau", () => {
    const page = buildMonEquipePage({ members, meetings, page: 1 });
    const standing = buildTeamMemberStanding({
      members,
      meetings,
      sellerUserId: "u07",
    });
    expect(standing.ranking).toEqual(page.ranking);
    expect(standing.teamSize).toBe(page.totalCount);
  });

  it("ne prête aucun rang à quelqu'un qui n'est pas dans l'équipe cadrée", () => {
    // Un manager peut ouvrir la fiche d'un commercial qui ne fait pas partie de
    // son périmètre. Mieux vaut ne rien annoncer qu'annoncer une place calculée
    // sur un groupe auquel l'intéressé n'appartient pas.
    const standing = buildTeamMemberStanding({
      members,
      meetings,
      sellerUserId: "inconnu",
    });
    expect(standing.row).toBeNull();
    expect(standing.teamSize).toBe(12);
  });

  it("garde la note d'un membre hors classement et dit pourquoi", () => {
    const standing = buildTeamMemberStanding({
      members: [membre("u1"), membre("u2")],
      meetings: [
        rdv("u1", { salesScore: 100 }),
        rdv("u2", { salesScore: 80 }),
        rdv("u2", { salesScore: 80 }),
        rdv("u2", { salesScore: 80 }),
      ],
      sellerUserId: "u1",
    });
    expect(standing.row?.noteGlobaleOn5).toBe(5);
    expect(standing.row?.rank).toBeNull();
    expect(standing.row?.tier).toBeNull();
    expect(standing.row?.unrankedReason).toBe("volume-insuffisant");
  });
});
