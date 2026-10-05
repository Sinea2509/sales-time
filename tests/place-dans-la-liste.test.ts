import { beforeEach, describe, expect, it } from "@jest/globals";

type JestFn = jest.Mock;

// eslint-disable-next-line no-var
var redirectMock: JestFn;
jest.mock("next/navigation", () => {
  redirectMock = jest.fn();
  return {
    redirect: (url: string) => {
      redirectMock(url);
      throw new Error(`REDIRECT:${url}`);
    },
  };
});

// eslint-disable-next-line no-var
var cookieValue: string | undefined;
jest.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "st_periode" && cookieValue != null
        ? { name, value: cookieValue }
        : undefined,
  }),
}));

import {
  ensureEligibleStatsWindow,
  pathWithStatsWindow,
} from "@/lib/resolve-stats-window-days";
import { ficheMembreHref, monEquipeListHref } from "@/lib/liens-mon-equipe";
import {
  DEFAULT_STATS_WINDOW_DAYS,
  type StatsWindowPreset,
} from "@/src/core/domain/dashboard-stats-window";

/**
 * Le manager doit retrouver la place qu'il avait dans la liste d'équipe.
 *
 * Trois écritures d'adresse tiennent ce va-et-vient : le lien qui mène à une
 * fiche, le lien de retour que la fiche construit, et la redirection qui
 * corrige une période sans assez de RDV. Chacune part d'une adresse et en
 * fabrique une autre, et chacune peut laisser tomber en chemin le numéro de
 * page sans que rien ne casse : la page 1 s'affiche, elle est valide, elle
 * n'est simplement pas celle qu'on regardait. Aucun test de rendu ne verrait
 * la différence, un diff non plus.
 *
 * Ce que ces tests ne couvrent pas : ils ne naviguent pas. Ils ne disent rien
 * du texte du lien de retour, ni du fait que le numéro de page emporté soit
 * celui que l'application a borné plutôt que celui de l'adresse brute, ni du
 * comportement du sélecteur de période, qui a sa propre écriture d'adresse
 * dans « dashboard-stats-period-select.tsx ».
 */

/** Les comptes de RDV par période, lus par la redirection. */
function comptes(trente: number, quatreVingtDix: number, douzeMois: number) {
  return { 30: trente, 90: quatreVingtDix, 365: douzeMois } as Record<
    StatsWindowPreset,
    number
  >;
}

/** Ce qu'une adresse nomme, sans dépendre de l'ordre de ses paramètres. */
function valeursDeLAdresse(adresse: string): Record<string, string[]> {
  const [, query = ""] = adresse.split("?");
  const lus: Record<string, string[]> = {};
  for (const [nom, valeur] of new URLSearchParams(query)) {
    (lus[nom] ??= []).push(valeur);
  }
  return lus;
}

describe("pathWithStatsWindow", () => {
  it("remplace la période sans toucher au reste de la requête", () => {
    const adresse = pathWithStatsWindow(
      "/company/equipe",
      { jours: "7", equipePage: "3" },
      90,
    );
    expect(adresse.split("?")[0]).toBe("/company/equipe");
    expect(valeursDeLAdresse(adresse)).toEqual({
      jours: ["90"],
      equipePage: ["3"],
    });
  });

  it("retire la période quand on lui passe null, et garde le reste", () => {
    const adresse = pathWithStatsWindow(
      "/company/equipe/u-1",
      { jours: "30", equipePage: "3" },
      null,
    );
    expect(valeursDeLAdresse(adresse)).toEqual({ equipePage: ["3"] });
  });

  it("ne laisse pas de point d'interrogation quand il ne reste rien", () => {
    expect(
      pathWithStatsWindow("/company/equipe/u-1", { jours: "30" }, null),
    ).toBe("/company/equipe/u-1");
  });

  it("ignore les paramètres sans valeur plutôt que d'écrire « undefined »", () => {
    const adresse = pathWithStatsWindow(
      "/company/equipe",
      { equipePage: undefined },
      30,
    );
    expect(adresse).not.toContain("undefined");
    expect(valeursDeLAdresse(adresse)).toEqual({ jours: ["30"] });
  });

  it("garde les deux valeurs d'un paramètre répété", () => {
    const adresse = pathWithStatsWindow(
      "/company/equipe",
      { tri: ["a", "b"] },
      365,
    );
    expect(valeursDeLAdresse(adresse)).toEqual({
      jours: ["365"],
      tri: ["a", "b"],
    });
  });
});

describe("ensureEligibleStatsWindow", () => {
  beforeEach(() => {
    redirectMock?.mockClear();
    cookieValue = undefined;
  });

  it("rend la période demandée, sans rediriger, même quand elle compte peu de RDV", async () => {
    await expect(
      ensureEligibleStatsWindow({
        searchParams: { jours: "90", equipePage: "3" },
        counts: comptes(1, 2, 40),
        redirectPath: "/company/equipe",
      }),
    ).resolves.toEqual({ days: 90, range: null });
    expect(redirectMock?.mock.calls.length ?? 0).toBe(0);
  });

  it("reprend la période choisie sur une autre page quand l'adresse n'en nomme pas", async () => {
    cookieValue = "365";
    await expect(
      ensureEligibleStatsWindow({
        searchParams: { equipePage: "3" },
        counts: comptes(12, 40, 90),
        redirectPath: "/company/equipe",
      }),
    ).resolves.toEqual({ days: 365, range: null });
  });

  it("préfère l'adresse au cookie, et 30 jours sans l'un ni l'autre", async () => {
    cookieValue = "365";
    await expect(
      ensureEligibleStatsWindow({
        searchParams: { jours: "30" },
        counts: comptes(12, 40, 90),
        redirectPath: "/company/equipe",
      }),
    ).resolves.toEqual({ days: 30, range: null });
    cookieValue = undefined;
    await expect(
      ensureEligibleStatsWindow({
        searchParams: {},
        counts: comptes(12, 40, 90),
        redirectPath: "/company/equipe",
      }),
    ).resolves.toEqual({ days: DEFAULT_STATS_WINDOW_DAYS, range: null });
  });
});

describe("la période choisie au calendrier", () => {
  beforeEach(() => {
    cookieValue = undefined;
  });

  it("se lit dans l'adresse, avant jours= et avant le cookie", async () => {
    cookieValue = "365";
    await expect(
      ensureEligibleStatsWindow({
        searchParams: { du: "2026-07-01", au: "2026-09-30", jours: "90" },
        counts: comptes(12, 40, 90),
        redirectPath: "/company/equipe",
      }),
    ).resolves.toEqual({
      days: 92,
      range: { from: "2026-07-01", to: "2026-09-30" },
    });
  });

  it("se reprend du cookie sur une autre page", async () => {
    cookieValue = "2026-01-01_2026-03-31";
    await expect(
      ensureEligibleStatsWindow({
        searchParams: {},
        counts: comptes(12, 40, 90),
        redirectPath: "/company",
      }),
    ).resolves.toEqual({
      days: 90,
      range: { from: "2026-01-01", to: "2026-03-31" },
    });
  });

  it("voyage dans les liens vers une fiche et dans la pagination", () => {
    const periode = {
      days: 92,
      range: { from: "2026-07-01", to: "2026-09-30" },
    };
    expect(valeursDeLAdresse(ficheMembreHref("u-1", periode, 2))).toEqual({
      du: ["2026-07-01"],
      au: ["2026-09-30"],
      equipePage: ["2"],
    });
    expect(
      valeursDeLAdresse(monEquipeListHref("/company/equipe", periode, 1)),
    ).toEqual({ du: ["2026-07-01"], au: ["2026-09-30"] });
  });

  it("remplace jours= par du= et au= sans toucher au reste", () => {
    expect(
      valeursDeLAdresse(
        pathWithStatsWindow(
          "/company/equipe",
          { jours: "90", equipePage: "3" },
          { days: 31, range: { from: "2026-08-01", to: "2026-08-31" } },
        ),
      ),
    ).toEqual({
      du: ["2026-08-01"],
      au: ["2026-08-31"],
      equipePage: ["3"],
    });
  });
});

describe("les liens de la page « Mon équipe »", () => {
  it("emporte la page de liste vers la fiche d'un membre", () => {
    expect(valeursDeLAdresse(ficheMembreHref("u-1", 90, 3))).toEqual({
      jours: ["90"],
      equipePage: ["3"],
    });
  });

  it("laisse l'adresse d'une fiche nue quand la période et la page sont celles par défaut", () => {
    expect(ficheMembreHref("u-1", DEFAULT_STATS_WINDOW_DAYS, 1)).toBe(
      "/company/equipe/u-1",
    );
  });

  it("nomme la période même par défaut dans le lien de pagination", () => {
    // La liste, elle, écrit toujours sa période : c'est le sélecteur juste
    // au-dessus qui la donne à lire, et une adresse muette le laisserait
    // afficher autre chose que ce que la page montre.
    expect(
      valeursDeLAdresse(monEquipeListHref("/company/equipe", 30, 2)),
    ).toEqual({
      jours: ["30"],
      equipePage: ["2"],
    });
  });

  it("n'écrit pas la première page", () => {
    expect(monEquipeListHref("/company", 30, 1)).toBe("/company?jours=30");
  });
});
