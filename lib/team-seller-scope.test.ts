import { describe, expect, it } from "@jest/globals";
import {
  DEFAULT_TRIAL_LIMIT,
  isOutsideScopedTeam,
  resolveManagerTeamUserIds,
  resolveSellerManagerNameLine,
  resolveSellerTeamUserIds,
  scopeMeetingsToTeam,
  scopeMembersToTeam,
} from "./team-seller-scope";

describe("team-seller-scope", () => {
  describe("resolveManagerTeamUserIds", () => {
    it("returns undefined for non-managers", async () => {
      const result = await resolveManagerTeamUserIds(
        { users: { listDirectReportUserIds: jest.fn() } } as never,
        { canManageOrganization: false, internalUserId: "mgr_1" },
      );
      expect(result).toBeUndefined();
    });

    it("returns undefined when manager has no direct reports", async () => {
      const result = await resolveManagerTeamUserIds(
        {
          users: {
            listDirectReportUserIds: jest.fn().mockResolvedValue([]),
          },
        } as never,
        { canManageOrganization: true, internalUserId: "mgr_1" },
      );
      expect(result).toBeUndefined();
    });

    it("returns manager plus direct reports when team exists", async () => {
      const result = await resolveManagerTeamUserIds(
        {
          users: {
            listDirectReportUserIds: jest
              .fn()
              .mockResolvedValue(["rep_1", "rep_2", "rep_1"]),
          },
        } as never,
        { canManageOrganization: true, internalUserId: "mgr_1" },
      );
      expect(result).toEqual(["mgr_1", "rep_1", "rep_2"]);
    });
  });

  describe("resolveSellerTeamUserIds", () => {
    it("returns undefined when the seller has no internal user id", async () => {
      const result = await resolveSellerTeamUserIds(
        {
          users: {
            findManagerUserId: jest.fn(),
            listDirectReportUserIds: jest.fn(),
          },
        } as never,
        { internalUserId: null },
      );
      expect(result).toBeUndefined();
    });

    it("returns undefined when the seller has no manager", async () => {
      const result = await resolveSellerTeamUserIds(
        {
          users: {
            findManagerUserId: jest.fn().mockResolvedValue(null),
            listDirectReportUserIds: jest.fn(),
          },
        } as never,
        { internalUserId: "rep_1" },
      );
      expect(result).toBeUndefined();
    });

    // Le point de toute la fonction : un commercial doit être classé sur
    // exactement le groupe que son manager voit, sans quoi les deux écrans
    // annoncent deux places différentes pour la même personne.
    it("returns the same team its manager would see", async () => {
      const deps = {
        users: {
          findManagerUserId: jest.fn().mockResolvedValue("mgr_1"),
          listDirectReportUserIds: jest
            .fn()
            .mockResolvedValue(["rep_1", "rep_2"]),
        },
      } as never;
      const vuCommercial = await resolveSellerTeamUserIds(deps, {
        internalUserId: "rep_1",
      });
      const vuManager = await resolveManagerTeamUserIds(deps, {
        canManageOrganization: true,
        internalUserId: "mgr_1",
      });
      expect(vuCommercial).toEqual(["mgr_1", "rep_1", "rep_2"]);
      expect(new Set(vuCommercial)).toEqual(new Set(vuManager));
    });

    it("keeps the seller in the team even if the report list is stale", async () => {
      const result = await resolveSellerTeamUserIds(
        {
          users: {
            findManagerUserId: jest.fn().mockResolvedValue("mgr_1"),
            listDirectReportUserIds: jest.fn().mockResolvedValue(["rep_2"]),
          },
        } as never,
        { internalUserId: "rep_1" },
      );
      expect(result).toEqual(["mgr_1", "rep_2", "rep_1"]);
    });
  });

  /*
    Ce que les cas qui suivent ne couvrent pas : la phrase affichée. Ils fixent
    le nom rendu et la manière de le chercher, pas le fait que la carte écrive
    « Équipe de » devant, ni qu'elle change de titre quand il manque.
  */
  describe("resolveSellerManagerNameLine", () => {
    const membershipDe = (user: {
      firstName?: string | null;
      lastName?: string | null;
      email: string;
    }) => ({
      user: { firstName: null, lastName: null, ...user },
    });

    it("returns null when the seller has no internal user id", async () => {
      const findManagerUserId = jest.fn();
      const result = await resolveSellerManagerNameLine(
        {
          users: { findManagerUserId },
          organizationTeam: { findMembershipForManagerView: jest.fn() },
        } as never,
        { organizationId: "org_1", internalUserId: null },
      );
      expect(result).toBeNull();
      expect(findManagerUserId).not.toHaveBeenCalled();
    });

    /*
      L'adhésion ne se cherche pas quand il n'y a personne à chercher. Le stub
      rendrait un nom si on l'appelait : sans cette précaution, retirer la
      garde laisserait le cas passer par une recherche qui ne trouve rien, et
      le `null` obtenu ressemblerait à celui qu'on voulait.
    */
    it("returns null without a lookup when no manager is declared", async () => {
      const findMembershipForManagerView = jest
        .fn()
        .mockResolvedValue(membershipDe({ email: "chef@exemple.fr" }));
      const result = await resolveSellerManagerNameLine(
        {
          users: { findManagerUserId: jest.fn().mockResolvedValue(null) },
          organizationTeam: { findMembershipForManagerView },
        } as never,
        { organizationId: "org_1", internalUserId: "rep_1" },
      );
      expect(result).toBeNull();
      expect(findMembershipForManagerView).not.toHaveBeenCalled();
    });

    /*
      Le rattachement est une propriété de la personne, qu'aucune organisation
      ne borne : rien n'empêche un manager d'avoir quitté celle qu'on regarde.
      La recherche passe donc par l'adhésion, et son absence renvoie l'écran au
      cas sans équipe, déjà écrit, plutôt qu'au nom d'un tiers.
    */
    it("returns null when the declared manager left this organization", async () => {
      const result = await resolveSellerManagerNameLine(
        {
          users: { findManagerUserId: jest.fn().mockResolvedValue("mgr_1") },
          organizationTeam: {
            findMembershipForManagerView: jest.fn().mockResolvedValue(null),
          },
        } as never,
        { organizationId: "org_1", internalUserId: "rep_1" },
      );
      expect(result).toBeNull();
    });

    it("looks the manager up inside the organization being read", async () => {
      const findMembershipForManagerView = jest
        .fn()
        .mockResolvedValue(
          membershipDe({ firstName: "Camille", lastName: "Roy", email: "c@x" }),
        );
      const result = await resolveSellerManagerNameLine(
        {
          users: { findManagerUserId: jest.fn().mockResolvedValue("mgr_1") },
          organizationTeam: { findMembershipForManagerView },
        } as never,
        { organizationId: "org_1", internalUserId: "rep_1" },
      );
      expect(result).toBe("Camille Roy");
      expect(findMembershipForManagerView).toHaveBeenCalledWith(
        "org_1",
        "mgr_1",
      );
    });

    /*
      Le nom se compose par `memberNameLine`, la règle que la fiche du manager
      et ses actions de rafraîchissement appliquent déjà. Un manager invité qui
      n'a pas renseigné son identité s'affiche donc par son adresse, ici comme
      ailleurs, plutôt que par une carte muette.
    */
    it("falls back to the manager e-mail like the rest of the app", async () => {
      const result = await resolveSellerManagerNameLine(
        {
          users: { findManagerUserId: jest.fn().mockResolvedValue("mgr_1") },
          organizationTeam: {
            findMembershipForManagerView: jest
              .fn()
              .mockResolvedValue(membershipDe({ email: "chef@exemple.fr" })),
          },
        } as never,
        { organizationId: "org_1", internalUserId: "rep_1" },
      );
      expect(result).toBe("chef@exemple.fr");
    });
  });

  /*
    Ce que les cas qui suivent ne couvrent pas : le câblage des pages. Ils
    prouvent que la règle « pas de périmètre veut dire tout » est écrite une
    fois et se comporte comme annoncé, pas qu'un écran donné pense à
    l'appliquer. C'est pourtant cet oubli qui a fait compter l'organisation
    entière sous le titre « équipe » sur `/company/analyse`, et aucun test de
    fonction pure ne l'aurait vu.
  */
  describe("scopeMeetingsToTeam", () => {
    /*
      « Pas de périmètre » veut dire « tout », jamais « rien ». Inverser cette
      règle viderait les écrans de toute organisation où personne n'a encore
      déclaré son manager, c'est-à-dire de celle qui vient d'ouvrir le produit.
      Le tableau reçu est rendu tel quel : le cas le plus fréquent ne paie pas
      de copie.
    */
    it("returns the very same list when no team is scoped", () => {
      const rdvs = [{ sellerUserId: "rep_1" }, { sellerUserId: "rep_2" }];
      expect(scopeMeetingsToTeam(rdvs, undefined)).toBe(rdvs);
      expect(scopeMeetingsToTeam(rdvs, null)).toBe(rdvs);
      expect(scopeMeetingsToTeam(rdvs, [])).toBe(rdvs);
    });

    it("keeps the team meetings in their original order", () => {
      const rdvs = [
        { id: "a", sellerUserId: "mgr_1" },
        { id: "b", sellerUserId: "autre_1" },
        { id: "c", sellerUserId: "rep_1" },
        { id: "d", sellerUserId: "autre_1" },
      ];
      expect(scopeMeetingsToTeam(rdvs, ["mgr_1", "rep_1"])).toEqual([
        { id: "a", sellerUserId: "mgr_1" },
        { id: "c", sellerUserId: "rep_1" },
      ]);
    });

    /*
      Un rendez-vous nomme deux personnes : le commercial qui l'a conduit et le
      prospect rencontré. Le périmètre d'équipe désigne la première.
    */
    it("scopes on the seller, not on another user id the row carries", () => {
      const rdvs = [{ sellerUserId: "rep_1", userId: "prospect_9" }];
      expect(scopeMeetingsToTeam(rdvs, ["rep_1"])).toHaveLength(1);
      expect(scopeMeetingsToTeam(rdvs, ["prospect_9"])).toHaveLength(0);
    });
  });

  describe("scopeMembersToTeam", () => {
    it("returns the very same list when no team is scoped", () => {
      const membres = [{ userId: "u_1" }, { userId: "u_2" }];
      expect(scopeMembersToTeam(membres, undefined)).toBe(membres);
      expect(scopeMembersToTeam(membres, null)).toBe(membres);
      expect(scopeMembersToTeam(membres, [])).toBe(membres);
    });

    it("keeps only the members of the team", () => {
      const membres = [
        { userId: "mgr_1" },
        { userId: "autre_1" },
        { userId: "rep_1" },
      ];
      expect(scopeMembersToTeam(membres, ["mgr_1", "rep_1"])).toEqual([
        { userId: "mgr_1" },
        { userId: "rep_1" },
      ]);
    });

    /*
      Un membre est désigné par son `userId` et non par son `membershipId` :
      l'appartenance à l'organisation et la personne sont deux choses, et c'est
      la seconde que le périmètre d'équipe nomme.
    */
    it("scopes on the user id, not on the membership id", () => {
      const membres = [{ userId: "rep_1", membershipId: "mem_1" }];
      expect(scopeMembersToTeam(membres, ["rep_1"])).toHaveLength(1);
      expect(scopeMembersToTeam(membres, ["mem_1"])).toHaveLength(0);
    });
  });

  /*
    Ce que les cas qui suivent ne couvrent pas : ce que la fiche en fait. Ils
    fixent la réponse, pas la phrase affichée ni le fait qu'un écran pense à
    poser la question.
  */
  describe("isOutsideScopedTeam", () => {
    /*
      « Pas de périmètre » veut dire « tout le monde », donc personne n'en est
      dehors. Répondre l'inverse écrirait « hors de votre équipe » sur chaque
      fiche d'une organisation où personne n'a encore déclaré son manager,
      c'est-à-dire de celle qui vient d'ouvrir le produit.
    */
    it("puts nobody outside when no team is scoped", () => {
      expect(isOutsideScopedTeam(undefined, "rep_1")).toBe(false);
      expect(isOutsideScopedTeam(null, "rep_1")).toBe(false);
      expect(isOutsideScopedTeam([], "rep_1")).toBe(false);
    });

    // Le manager fait partie de l'équipe qu'il administre : sa propre fiche ne
    // doit pas s'annoncer hors de sa propre équipe.
    it("puts a member of the scoped team inside", () => {
      expect(isOutsideScopedTeam(["mgr_1", "rep_1"], "rep_1")).toBe(false);
      expect(isOutsideScopedTeam(["mgr_1", "rep_1"], "mgr_1")).toBe(false);
    });

    it("puts a colleague of another team outside", () => {
      expect(isOutsideScopedTeam(["mgr_1", "rep_1"], "autre_1")).toBe(true);
    });

    /*
      La fiche s'en sert pour expliquer une absence que `scopeMembersToTeam`
      vient de produire. Les deux doivent donc retenir exactement les mêmes
      personnes : sinon la fiche explique un classement qui s'affiche, ou ne dit
      rien d'un classement qui manque.
    */
    it("agrees with scopeMembersToTeam on every case", () => {
      const equipe = ["mgr_1", "rep_1"];
      for (const userId of ["mgr_1", "rep_1", "autre_1"]) {
        const retenu = scopeMembersToTeam([{ userId }], equipe).length === 1;
        expect(isOutsideScopedTeam(equipe, userId)).toBe(!retenu);
      }
    });
  });

  /*
    Les deux cadrages servent le même tableau et doivent donc retenir les mêmes
    personnes. Un membre gardé dont les rendez-vous seraient écartés afficherait
    « 0 RDV » à un commercial qui en a conduit douze.
  */
  it("keeps meetings and members consistent for the same team", () => {
    const equipe = ["mgr_1", "rep_1"];
    const membres = [
      { userId: "mgr_1" },
      { userId: "rep_1" },
      { userId: "autre_1" },
    ];
    const rdvs = [
      { sellerUserId: "mgr_1" },
      { sellerUserId: "rep_1" },
      { sellerUserId: "autre_1" },
    ];
    const membresRetenus = new Set(
      scopeMembersToTeam(membres, equipe).map((m) => m.userId),
    );
    const vendeursRetenus = new Set(
      scopeMeetingsToTeam(rdvs, equipe).map((m) => m.sellerUserId),
    );
    expect(vendeursRetenus).toEqual(membresRetenus);
    expect(membresRetenus).toEqual(new Set(equipe));
  });

  it("exports DEFAULT_TRIAL_LIMIT as 5", () => {
    expect(DEFAULT_TRIAL_LIMIT).toBe(5);
  });
});
