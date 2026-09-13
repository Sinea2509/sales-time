import {
  SALES_PROFILE_DIMENSION_KEYS,
  type SalesProfileScores,
} from "./sales-profile-from-meetings";
import { PREMIER_PALIER_HAUT, RANKING_TIERS } from "./team-ranking";
import {
  amplitudeDesNotes,
  ecartMinimalSurPiste,
  membresAuPalier,
  nombreDeStratesParLargeur,
  teamDispersionDots,
  teamSkillOverview,
  type TeamDispersionEntry,
} from "./team-collective-view";

function notes(valeurs: Partial<SalesProfileScores>): SalesProfileScores {
  const base = {} as SalesProfileScores;
  for (const key of SALES_PROFILE_DIMENSION_KEYS) {
    base[key] = valeurs[key] ?? 60;
  }
  return base;
}

function membre(
  cle: string,
  noteOn5: number,
  rang = 1,
  libelle = cle,
): TeamDispersionEntry {
  return { cle, libelle, noteOn5, rang };
}

/* Une piste de 560 pixels et des pastilles de 28 : l'écart vaut 0,267…. */
const ECART = ecartMinimalSurPiste(560, 28);

/**
 * La règle d'empilement observée sur une seule largeur.
 *
 * Beaucoup de ces cas ne parlent que d'une piste : ce raccourci leur évite de
 * répéter un tableau d'un élément et de lire un tableau d'un élément.
 */
function dotsSurUneLargeur(
  entries: readonly TeamDispersionEntry[],
  ecartMinimal: number,
) {
  return teamDispersionDots(entries, [ecartMinimal]).map((dot) => ({
    ...dot,
    strate: dot.strates[0]!,
  }));
}

describe("teamSkillOverview", () => {
  it("ne décrit pas une équipe qui n'a aucune note", () => {
    expect(teamSkillOverview(null)).toBeNull();
  });

  it("range les six compétences de la plus haute à la plus basse", () => {
    const vue = teamSkillOverview(
      notes({
        assertivite: 50,
        ecouteActive: 90,
        capitalSympathie: 70,
        argumentation: 60,
        objections: 40,
        nextSteps: 80,
      }),
    );
    expect(vue?.bars.map((b) => b.key)).toEqual([
      "ecouteActive",
      "nextSteps",
      "capitalSympathie",
      "argumentation",
      "assertivite",
      "objections",
    ]);
  });

  it("départage deux compétences de même valeur par l'ordre des dimensions", () => {
    const vue = teamSkillOverview(notes({}));
    expect(vue?.bars.map((b) => b.key)).toEqual([
      ...SALES_PROFILE_DIMENSION_KEYS,
    ]);
  });

  it("pose le niveau moyen à la moyenne des six", () => {
    const vue = teamSkillOverview(
      notes({
        assertivite: 50,
        ecouteActive: 90,
        capitalSympathie: 70,
        argumentation: 60,
        objections: 40,
        nextSteps: 80,
      }),
    );
    expect(vue?.niveauMoyen).toBe(65);
  });

  /*
    Le manager a les deux nombres sous les yeux : celui de la barre et celui de
    la référence. S'il les soustrait, il doit retomber sur l'écart annoncé.
  */
  it("écrit un écart que le lecteur peut refaire de tête", () => {
    const vue = teamSkillOverview(
      notes({
        assertivite: 51.4,
        ecouteActive: 88.6,
        capitalSympathie: 70.2,
        argumentation: 61.9,
        objections: 39.5,
        nextSteps: 79.8,
      }),
    );
    for (const bar of vue?.bars ?? []) {
      expect(bar.ecart).toBe(bar.valeur - (vue?.niveauMoyen ?? 0));
    }
  });

  it("nomme le point fort et l'axe de travail de l'équipe", () => {
    const vue = teamSkillOverview(
      notes({ ecouteActive: 90, objections: 40, assertivite: 50 }),
    );
    expect(vue?.relief?.fort.key).toBe("ecouteActive");
    expect(vue?.relief?.fort.valeur).toBe(90);
    expect(vue?.relief?.faible.key).toBe("objections");
    expect(vue?.relief?.faible.valeur).toBe(40);
  });

  it("n'invente pas de relief sur une équipe plate", () => {
    const vue = teamSkillOverview(notes({}));
    expect(vue).not.toBeNull();
    expect(vue?.bars).toHaveLength(6);
    expect(vue?.relief).toBeNull();
  });

  it("arrondit les notes affichées, jamais l'écart deux fois", () => {
    const vue = teamSkillOverview(notes({ assertivite: 60.4 }));
    expect(vue?.bars.find((b) => b.key === "assertivite")?.valeur).toBe(60);
  });
});

describe("ecartMinimalSurPiste", () => {
  it("mesure la pastille et sa respiration sur toute l'échelle", () => {
    // 5 × (28 + 2) / 560
    expect(ecartMinimalSurPiste(560, 28)).toBeCloseTo(0.267_857, 5);
  });

  it("resserre l'empilement quand la piste s'élargit", () => {
    expect(ecartMinimalSurPiste(1120, 28)).toBeLessThan(
      ecartMinimalSurPiste(560, 28),
    );
  });
});

describe("teamDispersionDots", () => {
  it("ne place rien quand personne n'est classé", () => {
    expect(dotsSurUneLargeur([], ECART)).toEqual([]);
  });

  it("pose un membre seul sur la strate du bas", () => {
    const dots = dotsSurUneLargeur([membre("a", 3.7)], ECART);
    expect(dots).toHaveLength(1);
    expect(dots[0]?.strate).toBe(0);
    expect(dots[0]?.valeur).toBe(3.7);
  });

  it("empile deux membres qui affichent la même note", () => {
    const dots = dotsSurUneLargeur([membre("a", 3.7), membre("b", 3.7)], ECART);
    expect(dots.map((d) => d.strate)).toEqual([0, 1]);
  });

  it("laisse côte à côte deux membres assez éloignés", () => {
    const dots = dotsSurUneLargeur([membre("a", 2.1), membre("b", 4.4)], ECART);
    expect(dots.map((d) => d.strate)).toEqual([0, 0]);
  });

  /*
    0,2 d'écart tient sous la largeur d'une pastille : les deux se recouvriraient
    si elles restaient sur la même strate, alors même que leurs notes diffèrent.
  */
  it("empile deux membres proches sans être ex æquo", () => {
    const dots = dotsSurUneLargeur([membre("a", 3.6), membre("b", 3.8)], ECART);
    expect(dots.map((d) => d.strate)).toEqual([0, 1]);
  });

  it("redescend à la strate du bas dès que la place se libère", () => {
    const dots = dotsSurUneLargeur(
      [membre("a", 3.7), membre("b", 3.7), membre("c", 4.5)],
      ECART,
    );
    expect(dots.map((d) => [d.cle, d.strate])).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 0],
    ]);
  });

  it("rend les membres dans l'ordre de l'axe, de gauche à droite", () => {
    const dots = dotsSurUneLargeur(
      [membre("c", 4.5), membre("a", 2.2), membre("b", 3.7)],
      ECART,
    );
    expect(dots.map((d) => d.cle)).toEqual(["a", "b", "c"]);
  });

  it("range deux ex æquo dans le même ordre à chaque appel", () => {
    const entrees = [
      membre("u-2", 3.7, 1, "Zoé Martin"),
      membre("u-1", 3.7, 1, "Alix Bernard"),
    ];
    const premier = dotsSurUneLargeur(entrees, ECART).map((d) => d.cle);
    const second = dotsSurUneLargeur([...entrees].reverse(), ECART).map(
      (d) => d.cle,
    );
    expect(premier).toEqual(["u-1", "u-2"]);
    expect(second).toEqual(premier);
  });

  it("place le point sur la note affichée, pas sur la note brute", () => {
    const dots = dotsSurUneLargeur([membre("a", 3.74)], ECART);
    expect(dots[0]?.valeur).toBe(3.7);
  });

  it("traite comme ex æquo deux notes brutes qui s'affichent pareil", () => {
    const dots = dotsSurUneLargeur(
      [membre("a", 3.74), membre("b", 3.66)],
      ECART,
    );
    expect(dots.map((d) => d.valeur)).toEqual([3.7, 3.7]);
    expect(dots.map((d) => d.strate)).toEqual([0, 1]);
  });

  it("garde le rang du membre, pour le dire au survol", () => {
    const dots = dotsSurUneLargeur([membre("a", 4.3, 2)], ECART);
    expect(dots[0]?.rang).toBe(2);
  });

  /*
    Deux pastilles exactement à l'écart minimal se touchent sans se recouvrir :
    elles tiennent donc sur la même strate. Empiler à cette distance-là
    ajouterait une strate de hauteur pour rien, sur l'équipe la plus groupée,
    c'est-à-dire précisément celle dont la carte a le plus à dire.
  */
  it("laisse sur la même strate deux pastilles qui se touchent tout juste", () => {
    const dots = dotsSurUneLargeur([membre("a", 3), membre("b", 3.5)], 0.5);
    expect(dots.map((d) => d.strate)).toEqual([0, 0]);
  });

  it("suit l'écart minimal qu'on lui donne", () => {
    const serres = dotsSurUneLargeur([membre("a", 3.6), membre("b", 3.8)], 0.1);
    expect(serres.map((d) => d.strate)).toEqual([0, 0]);
  });

  it("empile une équipe entière groupée au même endroit", () => {
    const dots = dotsSurUneLargeur(
      [
        membre("a", 3.7),
        membre("b", 3.7),
        membre("c", 3.7),
        membre("d", 3.7),
        membre("e", 3.7),
      ],
      ECART,
    );
    expect(dots.map((d) => d.strate)).toEqual([0, 1, 2, 3, 4]);
  });

  /*
    4,3 − 3,8 vaut 0,4999999999999996 en virgule flottante, et non 0,5. Sans la
    marge de comparaison, cette paire-là perdrait l'égalité de justesse et
    gravirait une strate que le dessin n'a aucune raison d'ajouter. Le cas est
    exactement celui de l'équipe de démonstration, et il est passé inaperçu
    jusqu'à ce qu'on compte les strates à la main.
  */
  it("ne se laisse pas piéger par une soustraction flottante", () => {
    const dots = dotsSurUneLargeur([membre("a", 3.8), membre("b", 4.3)], 0.5);
    expect(dots.map((d) => d.strate)).toEqual([0, 0]);
  });
});

describe("teamDispersionDots, sur plusieurs largeurs", () => {
  /* Les quatre largeurs du dessin, pastilles de 28 pixels et anneau de 2. */
  const ECART_PAR_LARGEUR = [232, 344, 568, 856].map((largeur) =>
    ecartMinimalSurPiste(largeur, 32),
  );

  it("place les mêmes membres, au même endroit, dans le même ordre", () => {
    const entrees = [membre("a", 2.6), membre("b", 4.1), membre("c", 3.8)];
    const plusieurs = teamDispersionDots(entrees, ECART_PAR_LARGEUR);
    const une = teamDispersionDots(entrees, [ECART_PAR_LARGEUR[0]!]);

    expect(plusieurs.map((d) => [d.cle, d.valeur, d.strates[0]])).toEqual(
      une.map((d) => [d.cle, d.valeur, d.strates[0]]),
    );
  });

  it("étale sur la piste large ce que la piste étroite doit empiler", () => {
    const dots = teamDispersionDots(
      [
        membre("jf", 2.6),
        membre("md", 3.8),
        membre("sn", 3.8),
        membre("lb", 4.1),
        membre("cr", 4.3),
      ],
      ECART_PAR_LARGEUR,
    );

    /*
      Sur 232 pixels, 0,3 point vaut 14 pixels et deux pastilles de 28 ne
      tiennent pas côte à côte : l'empilement monte en escalier. Chaque largeur
      suivante en libère une, jusqu'à la piste de 568 où il ne reste que les
      deux notes strictement identiques à superposer.
    */
    expect(dots.map((d) => d.strates[0])).toEqual([0, 0, 1, 2, 3]);
    expect(dots.map((d) => d.strates[1])).toEqual([0, 0, 1, 2, 0]);
    expect(dots.map((d) => d.strates[2])).toEqual([0, 0, 1, 0, 1]);
    expect(dots.map((d) => d.strates[3])).toEqual([0, 0, 1, 0, 0]);
  });

  it("superpose deux notes identiques quelle que soit la largeur", () => {
    const dots = teamDispersionDots(
      [membre("a", 3.7), membre("b", 3.7)],
      [...ECART_PAR_LARGEUR],
    );
    for (let largeur = 0; largeur < ECART_PAR_LARGEUR.length; largeur += 1) {
      expect(dots.map((d) => d.strates[largeur])).toEqual([0, 1]);
    }
  });

  it("rend autant d'empilements qu'on lui a passé de largeurs", () => {
    const dots = teamDispersionDots(
      [membre("a", 3.7), membre("b", 3.9)],
      [...ECART_PAR_LARGEUR],
    );
    for (const dot of dots) {
      expect(dot.strates).toHaveLength(ECART_PAR_LARGEUR.length);
    }
  });

  it("rend des empilements identiques quand les largeurs le sont", () => {
    const dots = teamDispersionDots(
      [membre("a", 3.7), membre("b", 3.9), membre("c", 4.1)],
      [ECART_PAR_LARGEUR[0]!, ECART_PAR_LARGEUR[0]!],
    );
    expect(dots.map((d) => d.strates[1])).toEqual(
      dots.map((d) => d.strates[0]),
    );
  });

  it("ne pose aucune strate quand on ne lui donne aucune largeur", () => {
    const dots = teamDispersionDots([membre("a", 3.7)], []);
    expect(dots.map((d) => d.strates)).toEqual([[]]);
  });
});

describe("nombreDeStratesParLargeur", () => {
  it("ne réserve aucune strate pour une piste vide", () => {
    expect(nombreDeStratesParLargeur([])).toEqual([]);
  });

  it("compte la strate la plus haute occupée", () => {
    const dots = teamDispersionDots(
      [membre("a", 3.7), membre("b", 3.7), membre("c", 3.7)],
      [ECART],
    );
    expect(nombreDeStratesParLargeur(dots)).toEqual([3]);
  });

  it("ne compte qu'une strate quand personne ne se chevauche", () => {
    const dots = teamDispersionDots(
      [membre("a", 1.2), membre("b", 3.1), membre("c", 4.8)],
      [ECART],
    );
    expect(nombreDeStratesParLargeur(dots)).toEqual([1]);
  });

  it("compte chaque largeur pour elle-même, pas la plus étroite pour toutes", () => {
    const dots = teamDispersionDots(
      [
        membre("jf", 2.6),
        membre("md", 3.8),
        membre("sn", 3.8),
        membre("lb", 4.1),
        membre("cr", 4.3),
      ],
      [232, 344, 568, 856].map((largeur) => ecartMinimalSurPiste(largeur, 32)),
    );
    expect(nombreDeStratesParLargeur(dots)).toEqual([4, 3, 2, 2]);
  });
});

describe("amplitudeDesNotes", () => {
  it("ne mesure aucun étalement sur une piste vide", () => {
    expect(amplitudeDesNotes([])).toBeNull();
  });

  it("donne un étalement nul à un membre seul", () => {
    const dots = dotsSurUneLargeur([membre("a", 4.3)], ECART);
    expect(amplitudeDesNotes(dots)).toEqual({
      basse: 4.3,
      haute: 4.3,
      amplitude: 0,
    });
  });

  it("prend la plus basse et la plus haute des notes affichées", () => {
    const dots = dotsSurUneLargeur(
      [membre("a", 2.14), membre("b", 3.7), membre("c", 4.46)],
      ECART,
    );
    expect(amplitudeDesNotes(dots)).toEqual({
      basse: 2.1,
      haute: 4.5,
      amplitude: 2.4,
    });
  });

  /*
    4,3 − 3,1 vaut 1,2000000000000002 en virgule flottante. Sans arrondi, la
    carte écrirait ce nombre-là en toutes lettres sous le titre.
  */
  it("arrondit l'écart au lieu de rendre une soustraction flottante", () => {
    const dots = dotsSurUneLargeur([membre("a", 3.1), membre("b", 4.3)], ECART);
    expect(amplitudeDesNotes(dots)?.amplitude).toBe(1.2);
  });

  it("ne dépend pas de l'ordre dans lequel on lui donne les points", () => {
    const dots = dotsSurUneLargeur(
      [membre("a", 2.2), membre("b", 3.7), membre("c", 4.5)],
      ECART,
    );
    expect(amplitudeDesNotes([...dots].reverse())).toEqual(
      amplitudeDesNotes(dots),
    );
  });
});

describe("membresAuPalier", () => {
  it("ne compte personne sur une piste vide", () => {
    expect(membresAuPalier([], PREMIER_PALIER_HAUT)).toBe(0);
  });

  /*
    Le palier est atteint à partir de sa borne basse incluse. Une note posée
    exactement dessus est donc dedans, comme la pastille qui s'appuie sur le
    bord gauche de la bande de ce palier.
  */
  it("compte la note posée exactement sur la borne du palier", () => {
    const dots = dotsSurUneLargeur([membre("a", 3)], ECART);
    expect(membresAuPalier(dots, PREMIER_PALIER_HAUT)).toBe(1);
  });

  it("ne compte pas la note qui manque la borne d'un dixième", () => {
    const dots = dotsSurUneLargeur([membre("a", 2.9)], ECART);
    expect(membresAuPalier(dots, PREMIER_PALIER_HAUT)).toBe(0);
  });

  /*
    « Maîtrise ou plus » et non « Maîtrise » : quelqu'un qui est passé au palier
    du dessus a franchi celui-ci aussi, et un compte qui l'oublierait baisserait
    le jour où un commercial progresse.
  */
  it("compte aussi les membres des paliers au-dessus", () => {
    const dots = dotsSurUneLargeur(
      [membre("a", 1.2), membre("b", 3.2), membre("c", 4.6)],
      ECART,
    );
    expect(membresAuPalier(dots, PREMIER_PALIER_HAUT)).toBe(2);
  });

  it("compte toute l'équipe au premier palier, qui part de zéro", () => {
    const dots = dotsSurUneLargeur(
      [membre("a", 0), membre("b", 2.5), membre("c", 4.6)],
      ECART,
    );
    expect(membresAuPalier(dots, RANKING_TIERS[0]!)).toBe(3);
  });

  it("ne dépend pas de l'ordre dans lequel on lui donne les points", () => {
    const dots = dotsSurUneLargeur(
      [membre("a", 2.2), membre("b", 3.7), membre("c", 4.5)],
      ECART,
    );
    expect(membresAuPalier([...dots].reverse(), PREMIER_PALIER_HAUT)).toBe(
      membresAuPalier(dots, PREMIER_PALIER_HAUT),
    );
  });
});
