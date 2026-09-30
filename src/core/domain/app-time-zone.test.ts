import { describe, expect, it } from "@jest/globals";
import {
  APP_TIME_ZONE,
  parseWallClockInAppTimeZone,
  toAppTimeZoneDatetimeLocal,
} from "./app-time-zone";

describe("parseWallClockInAppTimeZone", () => {
  it("lit l'heure saisie comme une heure de Paris, été comme hiver", () => {
    expect(parseWallClockInAppTimeZone("2026-09-24T16:30")?.toISOString()).toBe(
      "2026-09-24T14:30:00.000Z",
    );
    expect(parseWallClockInAppTimeZone("2026-01-15T16:30")?.toISOString()).toBe(
      "2026-01-15T15:30:00.000Z",
    );
    expect(
      parseWallClockInAppTimeZone("2026-09-24T16:30:45")?.toISOString(),
    ).toBe("2026-09-24T14:30:45.000Z");
  });

  it("franchit minuit sans changer de jour à tort", () => {
    expect(parseWallClockInAppTimeZone("2026-09-24T00:30")?.toISOString()).toBe(
      "2026-09-23T22:30:00.000Z",
    );
  });

  it("traite les deux changements d'heure sans erreur", () => {
    // 2 h 30 n'existe pas le 29 mars 2026 : l'heure glisse à 3 h 30.
    expect(parseWallClockInAppTimeZone("2026-03-29T02:30")?.toISOString()).toBe(
      "2026-03-29T01:30:00.000Z",
    );
    // 2 h 30 existe deux fois le 25 octobre 2026 : lue à l'heure d'hiver.
    expect(parseWallClockInAppTimeZone("2026-10-25T02:30")?.toISOString()).toBe(
      "2026-10-25T01:30:00.000Z",
    );
  });

  it("lit aussi une heure sans fuseau qui porte des secondes et des millisecondes", () => {
    expect(
      parseWallClockInAppTimeZone("2026-09-24T16:30:00.000")?.toISOString(),
    ).toBe("2026-09-24T14:30:00.000Z");
  });

  it("refuse ce qui n'est pas une heure sans fuseau", () => {
    expect(parseWallClockInAppTimeZone("2026-09-24T14:30:00.000Z")).toBeNull();
    expect(parseWallClockInAppTimeZone("hier")).toBeNull();
    expect(parseWallClockInAppTimeZone("")).toBeNull();
  });
});

describe("toAppTimeZoneDatetimeLocal", () => {
  it("rend l'heure de Paris d'un instant, au format du champ", () => {
    expect(
      toAppTimeZoneDatetimeLocal(new Date("2026-09-24T14:30:00.000Z")),
    ).toBe("2026-09-24T16:30");
    expect(
      toAppTimeZoneDatetimeLocal(new Date("2026-09-23T22:30:00.000Z")),
    ).toBe("2026-09-24T00:30");
  });

  it("revient à l'heure saisie : enregistrer sans rien changer ne décale plus rien", () => {
    for (const saisie of [
      "2026-09-24T16:30",
      "2026-01-15T08:05",
      "2026-12-31T23:59",
      "2026-07-01T00:00",
    ]) {
      let valeur = saisie;
      for (let i = 0; i < 3; i += 1) {
        const instant = parseWallClockInAppTimeZone(valeur);
        expect(instant).not.toBeNull();
        valeur = toAppTimeZoneDatetimeLocal(instant as Date);
      }
      expect(valeur).toBe(saisie);
    }
  });

  it("vise Paris", () => {
    expect(APP_TIME_ZONE).toBe("Europe/Paris");
  });
});
