import { describe, expect, it } from "@jest/globals";
import { STATS_WINDOW_DAYS_OPTIONS } from "@/src/core/domain/dashboard-stats-window";
import { getStatsWindowRdvsCounts } from "./get-stats-window-availability";

const MS_PAR_JOUR = 86_400_000;

type EntreeDeComptage = {
  organizationId: string;
  since: Date;
  sellerUserIds?: string[];
};

/*
  La fausse base rend dix fois le nombre de jours que la borne reçue couvre.
  Un compte rangé sous une autre période que la sienne se voit donc tout de
  suite, sans avoir à figer l'horloge.
*/
function baseQuiCompte() {
  return {
    meetings: {
      countMeetingsWithMeetingAtSince: jest.fn(
        async (input: EntreeDeComptage) => {
          const jours = Math.round(
            (Date.now() - input.since.getTime()) / MS_PAR_JOUR,
          );
          return jours * 10;
        },
      ),
    },
  };
}

/*
  Ce que ces cas ne couvrent pas : la traduction du périmètre en requête, qui
  appartient à l'adaptateur Prisma, ni le fait qu'un écran pense à passer son
  équipe. Ils fixent le contrat entre les deux, à savoir qu'une période se
  compte sur la population que l'écran affiche, et que « pas de périmètre »
  veut dire « tout ».
*/
describe("getStatsWindowRdvsCounts", () => {
  it("asks the repository once for each period the selector offers", async () => {
    const base = baseQuiCompte();

    await getStatsWindowRdvsCounts(base as never, {
      organizationId: "org_1",
    });

    const appels = base.meetings.countMeetingsWithMeetingAtSince.mock.calls;
    expect(appels).toHaveLength(STATS_WINDOW_DAYS_OPTIONS.length);
    for (const appel of appels) {
      expect(appel[0].organizationId).toBe("org_1");
    }
  });

  /*
    Le sélecteur grise une période, et `ensureEligibleStatsWindowDays` peut
    même rediriger vers une autre. Deux comptes intervertis n'afficheraient
    donc pas une erreur : ils enverraient le lecteur sur la mauvaise période.
  */
  it("keys every count under the period it was asked for", async () => {
    const base = baseQuiCompte();

    const counts = await getStatsWindowRdvsCounts(base as never, {
      organizationId: "org_1",
    });

    expect(counts).toEqual({ 7: 70, 30: 300, 90: 900 });
  });

  /*
    Le sélecteur annonce la disponibilité d'un écran. Sur un écran d'équipe, il
    doit donc compter l'équipe : comptée sur l'organisation, une période peut
    s'annoncer disponible et s'afficher vide.
  */
  it("forwards the scoped team to every count", async () => {
    const base = baseQuiCompte();
    const equipe = ["mgr_1", "rep_1"];

    await getStatsWindowRdvsCounts(base as never, {
      organizationId: "org_1",
      sellerUserIds: equipe,
    });

    const appels = base.meetings.countMeetingsWithMeetingAtSince.mock.calls;
    expect(appels).toHaveLength(STATS_WINDOW_DAYS_OPTIONS.length);
    for (const appel of appels) {
      expect(appel[0].sellerUserIds).toEqual(equipe);
    }
  });

  /*
    « Pas de périmètre » veut dire « toute l'organisation », jamais
    « personne ». Une liste vide qui descendrait telle quelle jusqu'à la
    requête griserait toutes les périodes d'une organisation où personne n'a
    encore déclaré son manager.
  */
  it("counts the whole organization when no team is scoped", async () => {
    for (const sansEquipe of [undefined, null, []]) {
      const base = baseQuiCompte();

      await getStatsWindowRdvsCounts(base as never, {
        organizationId: "org_1",
        sellerUserIds: sansEquipe,
      });

      const appels = base.meetings.countMeetingsWithMeetingAtSince.mock.calls;
      expect(appels).toHaveLength(STATS_WINDOW_DAYS_OPTIONS.length);
      for (const appel of appels) {
        expect(appel[0].sellerUserIds).toBeUndefined();
      }
    }
  });
});
