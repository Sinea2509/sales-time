import { describe, expect, it } from "@jest/globals";
import { formatDurationHoursMinutes } from "./format-duration-fr";

/**
 * Ce que la fonction écrit, à la lettre et à l'espace près.
 *
 * L'espace insécable est nommée par son code plutôt qu'écrite telle quelle :
 * à l'écran elle ne se distingue pas d'une espace ordinaire, et un test qu'on
 * ne peut pas relire ne prouve rien.
 */
const NBSP = "\u00a0";

describe("formatDurationHoursMinutes", () => {
  it("sépare le nombre de son unité par une espace insécable", () => {
    expect(formatDurationHoursMinutes(32)).toBe(`32${NBSP}min`);
    expect(formatDurationHoursMinutes(220)).toBe(`3${NBSP}h${NBSP}40`);
  });

  it("écrit l'heure seule quand il ne reste aucune minute", () => {
    expect(formatDurationHoursMinutes(60)).toBe(`1${NBSP}h`);
    expect(formatDurationHoursMinutes(180)).toBe(`3${NBSP}h`);
  });

  it("garde les minutes sur deux chiffres derrière l'heure", () => {
    // Sans le remplissage, 185 s'écrirait « 3 h 5 », qui se lit comme 3 h 50.
    expect(formatDurationHoursMinutes(185)).toBe(`3${NBSP}h${NBSP}05`);
  });

  it("écrit zéro plutôt que rien", () => {
    expect(formatDurationHoursMinutes(0)).toBe(`0${NBSP}min`);
  });

  it("arrondit les minutes à l'entier le plus proche", () => {
    // Les moyennes arrivent en flottant : une durée moyenne par rendez-vous
    // vaut rarement un nombre rond de minutes.
    expect(formatDurationHoursMinutes(32.4)).toBe(`32${NBSP}min`);
    expect(formatDurationHoursMinutes(32.6)).toBe(`33${NBSP}min`);
  });

  it("ne coupe jamais le nombre de son unité", () => {
    // La règle qui justifie l'insécable : aucune espace ordinaire ne doit
    // rester dans le résultat, quelle que soit la durée.
    for (const minutes of [0, 1, 30, 59, 60, 61, 125, 600, 1440]) {
      expect(formatDurationHoursMinutes(minutes)).not.toContain(" ");
    }
  });
});
