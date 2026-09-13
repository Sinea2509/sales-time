import { describe, expect, it } from "@jest/globals";

import { listeDesSatellites } from "@/components/molecules/team-ranking-summary";
import type { TeamDispersionDot } from "@/src/core/domain/team-collective-view";
import type { TeamRankingSummary } from "@/src/core/domain/team-ranking";

/**
 * Les trois repères du bandeau d'équipe doivent dire leur unité.
 *
 * Ils sont rendus dans des cases identiques, au même corps et au même gras.
 * Deux d'entre eux comptent des personnes, le troisième mesure un écart de
 * notes, et rien dans la forme ne les sépare : « 5 », « 3 », « 1,4 » se lisent
 * d'une traite comme trois dénombrements. Le défaut ne casse rien, ne lève
 * aucune erreur et ne se voit pas sur une capture ; il fait seulement lire au
 * manager « 1,4 personne d'écart » là où il y a 1,4 point.
 *
 * Ce que ces tests ne couvrent pas : ils ne rendent rien. Ils ne disent rien de
 * la place de l'unité à l'écran, ni du fait qu'elle soit distinguée de la
 * précision qui la suit, ni des libellés eux-mêmes, ni du bandeau de moyenne
 * au-dessus. Ils ne couvrent pas non plus la légende des compétences sur 100,
 * qui vit dans « team-collective-overview.tsx » et n'a pas de fonction pure à
 * interroger.
 */

/** Un membre posé sur la piste, à la note voulue. */
function dot(cle: string, valeur: number): TeamDispersionDot {
  return {
    cle,
    libelle: cle,
    noteOn5: valeur,
    valeur,
    rang: 1,
    strates: [0],
  };
}

/** Un classement dont seul le nombre de classés compte ici. */
function classement(rankedCount: number): TeamRankingSummary {
  return {
    rankedCount,
    unrankedCount: 0,
    unrankedNoScoreCount: 0,
    unrankedLowVolumeCount: 0,
    averageNoteOn5: rankedCount === 0 ? null : 3.5,
    minScoredMeetings: 3,
  };
}

/** Le repère d'une clé donnée, ou `undefined` s'il n'est pas rendu. */
function satelliteParCle(
  satellites: ReturnType<typeof listeDesSatellites>,
  cle: string,
) {
  return satellites.find((s) => s.cle === cle);
}

describe("les repères du bandeau d'équipe", () => {
  it("donne son unité à l'écart, qui ne compte pas des personnes", () => {
    const satellites = listeDesSatellites(classement(3), 5, [
      dot("a", 2.9),
      dot("b", 3.5),
      dot("c", 4.3),
    ]);
    expect(satelliteParCle(satellites, "amplitude")?.valeur).toBe("1,4");
    expect(satelliteParCle(satellites, "amplitude")?.unite).toBe("point");
  });

  it("accorde cette unité au pluriel à partir de deux points", () => {
    // 2,2 et non 2 tout rond : c'est le nombre écrit à côté du mot qui commande
    // son pluriel, et un écart de notes tombe rarement sur un entier.
    const satellites = listeDesSatellites(classement(2), 5, [
      dot("a", 1.5),
      dot("b", 3.7),
    ]);
    expect(satelliteParCle(satellites, "amplitude")?.valeur).toBe("2,2");
    expect(satelliteParCle(satellites, "amplitude")?.unite).toBe("points");
  });

  it("n'ajoute pas d'unité aux repères qui comptent des personnes", () => {
    // Leur précision porte déjà le mot : « sur 5 membres ». Une unité y
    // écrirait « 3 personnes sur 5 membres ».
    const satellites = listeDesSatellites(classement(3), 5, [
      dot("a", 2.9),
      dot("b", 4.3),
    ]);
    expect(satelliteParCle(satellites, "effectif")?.unite).toBeUndefined();
    expect(satelliteParCle(satellites, "palier")?.unite).toBeUndefined();
  });

  it("ne mesure pas d'écart sur un seul membre classé", () => {
    // Il vaudrait 0, ce qui se lirait « équipe parfaitement groupée » alors
    // qu'il n'y a personne avec qui être groupé.
    const satellites = listeDesSatellites(classement(1), 5, [dot("a", 4.2)]);
    expect(satelliteParCle(satellites, "amplitude")).toBeUndefined();
    expect(satelliteParCle(satellites, "effectif")).toBeDefined();
  });

  it("ne montre aucun palier tant que personne n'est classé", () => {
    const satellites = listeDesSatellites(classement(0), 5, []);
    expect(satellites.map((s) => s.cle)).toEqual(["effectif"]);
    expect(satelliteParCle(satellites, "effectif")?.precision).toBe(
      "sur 5 membres",
    );
  });
});
