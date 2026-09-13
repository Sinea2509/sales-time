import { describe, expect, it } from "@jest/globals";
import {
  essentielDuManager,
  essentielEstVide,
  type MembreClasseDeLaDispersion,
} from "@/lib/essentiel-du-manager";

/**
 * Ces tests relisent les trois cartes que le manager voit en premier : qui est
 * en tête, qui coacher, qui n'est pas encore évaluable. Ils ne couvrent pas le
 * rendu des cartes (le composant importe next-intl, que Jest ne charge pas) ni
 * le calcul du classement lui-même, déjà relu par team-ranking.test.ts : ici,
 * seulement le choix des personnes et les phrases exactes.
 */

function classe(
  userId: string,
  rang: number,
  noteOn5: number,
): MembreClasseDeLaDispersion {
  return {
    userId,
    firstName: userId.toUpperCase(),
    lastName: "Test",
    email: `${userId}@test.fr`,
    noteOn5,
    rang,
  };
}

const RANKING = {
  rankedCount: 3,
  unrankedNoScoreCount: 0,
  unrankedLowVolumeCount: 0,
  minScoredMeetings: 3,
};

function essentiel(
  over: Partial<Parameters<typeof essentielDuManager>[0]> = {},
) {
  return essentielDuManager({
    dispersion: [
      classe("u1", 1, 4.3),
      classe("u2", 2, 3.7),
      classe("u3", 3, 2.1),
    ],
    rows: [
      {
        userId: "u1",
        skillSignature: {
          fort: "ecouteActive",
          ecartFort: 17,
          faible: "assertivite",
          ecartFaible: -2,
        },
      },
      {
        userId: "u3",
        skillSignature: {
          fort: "capitalSympathie",
          ecartFort: 3,
          faible: "assertivite",
          ecartFaible: -12,
        },
      },
    ],
    ranking: RANKING,
    statsWindowDays: 30,
    equipePage: 1,
    ...over,
  });
}

describe("essentielDuManager", () => {
  it("met le premier rang en tête et le dernier rang à coacher", () => {
    const p = essentiel();
    expect(p.meneur?.userId).toBe("u1");
    expect(p.meneur?.nom).toBe("U1 Test");
    expect(p.meneur?.note).toBe("4,3");
    expect(p.meneur?.rangEtBase).toBe("1re place sur 3 membres classés");
    expect(p.aCoacher?.userId).toBe("u3");
    expect(p.aCoacher?.note).toBe("2,1");
    expect(p.aCoacher?.rangEtBase).toBe("3e place sur 3 membres classés");
    expect(p.premierRangPartage).toBeNull();
  });

  it("écrit la compétence dans les mots des pastilles de la fiche", () => {
    const p = essentiel();
    expect(p.meneur?.competence).toBe("Point fort · Écoute active +17");
    expect(p.aCoacher?.competence).toBe("Axe d'amélioration · Assertivité −12");
  });

  it("se tait sur la compétence d'un membre absent de la page chargée", () => {
    // u3 est classé dernier mais sa ligne n'est pas dans la page : la carte
    // le nomme quand même, sans inventer de signature.
    const p = essentiel({ rows: [] });
    expect(p.aCoacher?.userId).toBe("u3");
    expect(p.aCoacher?.competence).toBeNull();
  });

  it("mène chaque carte vers la fiche du membre, période comprise", () => {
    const p = essentiel({ statsWindowDays: 7, equipePage: 2 });
    expect(p.meneur?.href).toBe("/company/equipe/u1?jours=7&equipePage=2");
    expect(p.aCoacher?.href).toBe("/company/equipe/u3?jours=7&equipePage=2");
  });

  it("dit l'égalité quand le premier rang est partagé", () => {
    const p = essentiel({
      dispersion: [
        classe("u1", 1, 4.3),
        classe("u2", 1, 4.3),
        classe("u3", 3, 2.1),
      ],
    });
    expect(p.meneur?.userId).toBe("u1");
    expect(p.premierRangPartage).toBe("à égalité avec 1 autre membre");
  });

  it("ne désigne personne à coacher quand toute l'équipe partage le premier rang", () => {
    const p = essentiel({
      dispersion: [classe("u1", 1, 4), classe("u2", 1, 4)],
      ranking: { ...RANKING, rankedCount: 2 },
    });
    expect(p.meneur).not.toBeNull();
    expect(p.aCoacher).toBeNull();
    expect(p.premierRangPartage).toBe("à égalité avec 1 autre membre");
  });

  it("ne désigne personne à coacher quand une seule personne est classée", () => {
    const p = essentiel({
      dispersion: [classe("u1", 1, 4)],
      ranking: { ...RANKING, rankedCount: 1 },
    });
    expect(p.meneur?.rangEtBase).toBe("1re place sur 1 membre classé");
    expect(p.aCoacher).toBeNull();
  });

  it("liste les membres à faire analyser, une raison par ligne, accordée", () => {
    const p = essentiel({
      ranking: {
        rankedCount: 3,
        unrankedNoScoreCount: 2,
        unrankedLowVolumeCount: 1,
        minScoredMeetings: 3,
      },
    });
    expect(p.aFaireAnalyser).toEqual([
      "2 membres sans aucun rendez-vous noté sur la période",
      "1 membre sous le seuil de 3 rendez-vous notés",
    ]);
  });

  it("rend trois cartes vides sur une équipe sans donnée", () => {
    const p = essentiel({
      dispersion: [],
      rows: [],
      ranking: {
        rankedCount: 0,
        unrankedNoScoreCount: 0,
        unrankedLowVolumeCount: 0,
        minScoredMeetings: 3,
      },
    });
    expect(p.meneur).toBeNull();
    expect(p.aCoacher).toBeNull();
    expect(p.aFaireAnalyser).toEqual([]);
    expect(essentielEstVide(p)).toBe(true);
  });

  it("garde des priorités dès qu'une seule carte parle", () => {
    const seulementAnalyser = essentiel({
      dispersion: [],
      ranking: {
        rankedCount: 0,
        unrankedNoScoreCount: 1,
        unrankedLowVolumeCount: 0,
        minScoredMeetings: 3,
      },
    });
    expect(essentielEstVide(seulementAnalyser)).toBe(false);
  });
});
