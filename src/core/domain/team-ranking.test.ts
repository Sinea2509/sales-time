import { describe, expect, it } from "@jest/globals";
import {
  DISC_LABEL_FR,
  SONCAS_LABEL_FR,
} from "./seller-affinity-from-meetings";
import {
  DEFAULT_MIN_SCORED_MEETINGS,
  RANKING_TIERS,
  displayedNoteOn5,
  formatDeltaOn5,
  formatNoteFr,
  rankLabel,
  rankTeamMembers,
  tierFromNoteOn5,
  tierRangeLabel,
  unrankedExplanation,
} from "./team-ranking";

function membre(noteGlobaleOn5: number | null, scoredMeetings = 10) {
  return { noteGlobaleOn5, scoredMeetings };
}

describe("tierFromNoteOn5", () => {
  it("place chaque borne dans le bon palier", () => {
    expect(tierFromNoteOn5(0)?.id).toBe("demarrage");
    expect(tierFromNoteOn5(1.9)?.id).toBe("demarrage");
    expect(tierFromNoteOn5(2)?.id).toBe("progression");
    expect(tierFromNoteOn5(2.9)?.id).toBe("progression");
    expect(tierFromNoteOn5(3)?.id).toBe("maitrise");
    expect(tierFromNoteOn5(3.9)?.id).toBe("maitrise");
    expect(tierFromNoteOn5(4)?.id).toBe("excellence");
    expect(tierFromNoteOn5(5)?.id).toBe("excellence");
  });

  it("classe sur la note affichée, pas sur la note brute", () => {
    // 1,96 s'affiche « 2,0 », donc le palier lu doit être Progression.
    expect(tierFromNoteOn5(1.96)?.id).toBe("progression");
  });

  it("ne renvoie aucun palier sans note", () => {
    expect(tierFromNoteOn5(null)).toBeNull();
    expect(tierFromNoteOn5(Number.NaN)).toBeNull();
  });

  it("couvre l'échelle sans trou ni recouvrement", () => {
    RANKING_TIERS.forEach((tier, i) => {
      const suivant = RANKING_TIERS[i + 1];
      if (suivant) expect(tier.maxNoteOn5).toBe(suivant.minNoteOn5);
      else expect(tier.maxNoteOn5).toBeNull();
    });
    expect(RANKING_TIERS[0]?.minNoteOn5).toBe(0);
  });
});

describe("rankTeamMembers", () => {
  it("rend une équipe vide sans moyenne", () => {
    const r = rankTeamMembers([]);
    expect(r.rows).toHaveLength(0);
    expect(r.rankedCount).toBe(0);
    expect(r.averageNoteOn5).toBeNull();
    expect(r.minScoredMeetings).toBe(DEFAULT_MIN_SCORED_MEETINGS);
  });

  it("classe par note décroissante et conserve l'ordre reçu", () => {
    const r = rankTeamMembers([membre(3), membre(4.5), membre(2)]);
    expect(r.rows.map((x) => x.rank)).toEqual([2, 1, 3]);
  });

  it("donne le même rang aux ex æquo et saute le rang suivant", () => {
    const r = rankTeamMembers([membre(4), membre(4), membre(3)]);
    expect(r.rows.map((x) => x.rank)).toEqual([1, 1, 3]);
    expect(r.rows.map((x) => x.tied)).toEqual([true, true, false]);
  });

  it("traite comme ex æquo deux notes brutes différentes qui s'affichent pareil", () => {
    const r = rankTeamMembers([membre(3.51), membre(3.54)]);
    expect(r.rows.map((x) => x.rank)).toEqual([1, 1]);
  });

  it("écarte du classement en dessous du seuil de volume", () => {
    const r = rankTeamMembers([membre(4.8, 1), membre(3, 10)]);
    expect(r.rows[0]?.rank).toBeNull();
    expect(r.rows[0]?.unrankedReason).toBe("volume-insuffisant");
    expect(r.rows[1]?.rank).toBe(1);
    expect(r.rankedCount).toBe(1);
    expect(r.unrankedCount).toBe(1);
  });

  it("garde le score d'un membre écarté mais ne lui décerne pas de palier", () => {
    const r = rankTeamMembers([membre(4.8, 1)]);
    expect(r.rows[0]?.noteGlobaleOn5).toBe(4.8);
    expect(r.rows[0]?.rank).toBeNull();
    expect(r.rows[0]?.tier).toBeNull();
  });

  it("ne décerne un palier qu'aux membres classés", () => {
    const r = rankTeamMembers([
      membre(4.8, 1),
      membre(4.2, 12),
      membre(null, 0),
    ]);
    expect(r.rows.map((x) => x.tier?.id ?? null)).toEqual([
      null,
      "excellence",
      null,
    ]);
  });

  it("aligne exactement palier et rang : jamais l'un sans l'autre", () => {
    const equipe = [
      membre(4.8, 1),
      membre(4.2, 12),
      membre(null, 0),
      membre(3, 3),
      membre(2, 2),
    ];
    rankTeamMembers(equipe).rows.forEach((row) => {
      expect(row.tier == null).toBe(row.rank == null);
    });
  });

  it("écarte un membre sans note en le distinguant du volume insuffisant", () => {
    const r = rankTeamMembers([membre(null, 0)]);
    expect(r.rows[0]?.unrankedReason).toBe("sans-note");
    expect(r.rows[0]?.tier).toBeNull();
    expect(r.averageNoteOn5).toBeNull();
  });

  it("respecte un seuil personnalisé", () => {
    const r = rankTeamMembers([membre(4, 2)], { minScoredMeetings: 2 });
    expect(r.rows[0]?.rank).toBe(1);
    expect(r.minScoredMeetings).toBe(2);
  });

  it("calcule la moyenne sur les seuls membres classés", () => {
    const r = rankTeamMembers([membre(4, 10), membre(3, 10), membre(0.5, 1)]);
    expect(r.averageNoteOn5).toBe(3.5);
  });

  it("arrondit la moyenne au dixième", () => {
    const r = rankTeamMembers([membre(4), membre(3), membre(3)]);
    expect(r.averageNoteOn5).toBe(3.3);
  });

  it("donne un écart égal à la différence des valeurs affichées", () => {
    const r = rankTeamMembers([membre(3.5), membre(3.2), membre(2.9)]);
    const moyenne = r.averageNoteOn5;
    expect(moyenne).toBe(3.2);
    r.rows.forEach((row) => {
      if (row.rank == null || row.noteGlobaleOn5 == null || moyenne == null) {
        return;
      }
      expect(row.deltaToTeamAverage).toBe(
        displayedNoteOn5(displayedNoteOn5(row.noteGlobaleOn5) - moyenne),
      );
    });
    expect(r.rows.map((x) => x.deltaToTeamAverage)).toEqual([0.3, 0, -0.3]);
  });

  it("n'attribue pas d'écart hors classement", () => {
    const r = rankTeamMembers([membre(4, 10), membre(1, 1)]);
    expect(r.rows[1]?.deltaToTeamAverage).toBeNull();
  });

  it("donne le même rang quel que soit l'ordre d'entrée", () => {
    const equipe = [membre(2.2), membre(4.4), membre(3.3)];
    const direct = rankTeamMembers(equipe);
    const inverse = rankTeamMembers([...equipe].reverse());
    expect(direct.rows.map((x) => x.rank)).toEqual([3, 1, 2]);
    expect(inverse.rows.map((x) => x.rank)).toEqual([2, 1, 3]);
    expect(direct.averageNoteOn5).toBe(inverse.averageNoteOn5);
  });

  it("conserve les champs du membre reçu", () => {
    const r = rankTeamMembers([
      { noteGlobaleOn5: 4, scoredMeetings: 5, email: "a@test.fr" },
    ]);
    expect(r.rows[0]?.email).toBe("a@test.fr");
  });
});

describe("libellés", () => {
  it("écrit les places sans supposer le genre", () => {
    expect(rankLabel(1)).toBe("1re place");
    expect(rankLabel(4)).toBe("4e place");
  });

  it("écrit les notes à la française", () => {
    expect(formatNoteFr(4)).toBe("4");
    expect(formatNoteFr(3.5)).toBe("3,5");
    expect(formatNoteFr(1.9)).toBe("1,9");
  });

  it("borne chaque palier de façon lisible", () => {
    expect(tierRangeLabel(RANKING_TIERS[0]!)).toBe("Démarrage : 0 à 1,9");
    expect(tierRangeLabel(RANKING_TIERS[3]!)).toBe("Excellence : 4 à 5");
  });

  it("accorde le nombre de rendez-vous dans l'explication", () => {
    expect(unrankedExplanation("volume-insuffisant", 1, 3)).toContain(
      "1 rendez-vous noté sur",
    );
    expect(unrankedExplanation("volume-insuffisant", 2, 3)).toContain(
      "2 rendez-vous notés sur",
    );
  });

  it("distingue l'absence de note du volume insuffisant", () => {
    expect(unrankedExplanation("sans-note", 0, 3)).toContain(
      "Aucun rendez-vous noté",
    );
  });

  it("annonce que le palier est retenu, pas seulement le rang", () => {
    expect(unrankedExplanation("sans-note", 0, 3)).toContain("palier");
    expect(unrankedExplanation("volume-insuffisant", 1, 3)).toContain("palier");
  });

  it("n'utilise aucun tiret cadratin", () => {
    const textes = [
      ...RANKING_TIERS.map((t) => `${t.nom} ${tierRangeLabel(t)}`),
      rankLabel(1),
      rankLabel(7),
      unrankedExplanation("sans-note", 0, 3),
      unrankedExplanation("volume-insuffisant", 1, 3),
      unrankedExplanation("volume-insuffisant", 5, 3),
      formatDeltaOn5(1),
      formatDeltaOn5(-0.3),
    ];
    textes.forEach((t) => expect(t).not.toContain("—"));
  });
});

describe("vocabulaire des paliers", () => {
  /**
   * Le palier s'affiche sur la même ligne que la posture SONCAS du commercial, à
   * deux colonnes d'écart, et juste à côté de son rang. Un palier qui reprendrait
   * un mot déjà pris ferait porter deux sens au même mot sur une seule ligne : le
   * lecteur ne pourrait plus savoir lequel il lit. Ces deux tests gardent la
   * décision de nommage, qui ne se voit qu'à l'écran et se perdrait sans eux.
   */
  it("n'emprunte aucun mot au vocabulaire SONCAS ou DISC", () => {
    const dejaPris = new Set(
      [...Object.values(SONCAS_LABEL_FR), ...Object.values(DISC_LABEL_FR)].map(
        (mot) => mot.toLowerCase(),
      ),
    );
    RANKING_TIERS.forEach((tier) => {
      expect(dejaPris.has(tier.nom.toLowerCase())).toBe(false);
    });
  });

  it("ne nomme aucun palier d'après une place de podium", () => {
    // Un palier est absolu et peut être partagé ; le rang, lui, est relatif et
    // s'affiche dans la colonne voisine. « 3e place · Or » se contredirait.
    const podium = ["or", "argent", "bronze", "1er", "premier", "première"];
    RANKING_TIERS.forEach((tier) => {
      expect(podium).not.toContain(tier.nom.toLowerCase());
    });
  });

  it("nomme chaque palier par un nom distinct et non vide", () => {
    const noms = RANKING_TIERS.map((t) => t.nom);
    expect(new Set(noms).size).toBe(noms.length);
    noms.forEach((nom) => expect(nom.trim().length).toBeGreaterThan(0));
  });
});

describe("formatDeltaOn5", () => {
  it("écrit toujours une décimale, même sur un compte rond", () => {
    expect(formatDeltaOn5(1)).toBe("+1,0");
    expect(formatDeltaOn5(-2)).toBe("−2,0");
    expect(formatDeltaOn5(0)).toBe("+0,0");
  });

  it("écrit le signe négatif et non le trait d'union", () => {
    expect(formatDeltaOn5(-0.3)).toBe("−0,3");
    expect(formatDeltaOn5(-0.3)).not.toContain("-");
  });

  it("arrondit au dixième comme la note affichée", () => {
    expect(formatDeltaOn5(0.44)).toBe("+0,4");
    expect(formatDeltaOn5(-1.46)).toBe("−1,5");
  });

  it("aligne toutes les valeurs sur la même longueur de partie décimale", () => {
    const colonne = [1, 0.4, -0.3, -1.4].map(formatDeltaOn5);
    const decimales = colonne.map((t) => t.split(",")[1]?.length ?? 0);
    expect(new Set(decimales).size).toBe(1);
  });
});

describe("comptes hors classement", () => {
  it("sépare l'absence de note du volume insuffisant", () => {
    const r = rankTeamMembers([
      membre(4.2),
      membre(3.1),
      membre(2.8, 1),
      membre(null, 0),
      membre(null, 0),
    ]);
    expect(r.rankedCount).toBe(2);
    expect(r.unrankedCount).toBe(3);
    expect(r.unrankedLowVolumeCount).toBe(1);
    expect(r.unrankedNoScoreCount).toBe(2);
  });

  it("répartit chaque membre écarté dans une raison et une seule", () => {
    const r = rankTeamMembers([
      membre(4.2),
      membre(2.8, 1),
      membre(null, 0),
      membre(1.5, 2),
    ]);
    expect(r.unrankedLowVolumeCount + r.unrankedNoScoreCount).toBe(
      r.unrankedCount,
    );
  });

  it("ne compte aucune exclusion quand toute l'équipe est classée", () => {
    const r = rankTeamMembers([membre(4.2), membre(3.1)]);
    expect(r.unrankedCount).toBe(0);
    expect(r.unrankedLowVolumeCount).toBe(0);
    expect(r.unrankedNoScoreCount).toBe(0);
  });

  it("compte une équipe vide sans exclusion", () => {
    const r = rankTeamMembers([]);
    expect(r.rankedCount).toBe(0);
    expect(r.unrankedCount).toBe(0);
    expect(r.unrankedLowVolumeCount).toBe(0);
    expect(r.unrankedNoScoreCount).toBe(0);
  });

  it("classe sans note comme sans-note même si le volume est nul des deux côtés", () => {
    const r = rankTeamMembers([membre(null, 0)]);
    expect(r.rows[0]?.unrankedReason).toBe("sans-note");
    expect(r.unrankedNoScoreCount).toBe(1);
    expect(r.unrankedLowVolumeCount).toBe(0);
  });
});
