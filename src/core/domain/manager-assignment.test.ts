import { describe, expect, it } from "@jest/globals";
import {
  managerAssignmentRefusalMessage,
  managerChoicesForMember,
  resolveManagerAssignment,
  type ManagerAssignmentCandidate,
  type ManagerAssignmentRefusal,
} from "./manager-assignment";

const EQUIPE: ManagerAssignmentCandidate[] = [
  { userId: "mgr_1", role: "ADMIN" },
  { userId: "mgr_2", role: "ADMIN" },
  { userId: "rep_1", role: "MEMBER" },
  { userId: "rep_2", role: "MEMBER" },
];

describe("managerChoicesForMember", () => {
  it("offers only the members who can administer the organization", () => {
    expect(
      managerChoicesForMember(EQUIPE, "rep_1").map((c) => c.userId),
    ).toEqual(["mgr_1", "mgr_2"]);
  });

  it("never offers a person to themselves", () => {
    expect(
      managerChoicesForMember(EQUIPE, "mgr_1").map((c) => c.userId),
    ).toEqual(["mgr_2"]);
  });

  it("offers nothing when the organization has a single manager", () => {
    const seul: ManagerAssignmentCandidate[] = [
      { userId: "mgr_1", role: "ADMIN" },
      { userId: "rep_1", role: "MEMBER" },
    ];
    expect(managerChoicesForMember(seul, "mgr_1")).toEqual([]);
  });

  it("keeps the order of the list it receives", () => {
    const inverse = [...EQUIPE].reverse();
    expect(
      managerChoicesForMember(inverse, "rep_1").map((c) => c.userId),
    ).toEqual(["mgr_2", "mgr_1"]);
  });

  /*
    Le menu de la page équipe écrit un nom, pas un identifiant. Il passe donc
    ses lignes entières et doit les retrouver entières.
  */
  it("gives back the rows it received, not a reduced copy", () => {
    const nommes = [
      { userId: "mgr_1", role: "ADMIN" as const, nom: "Alice" },
      { userId: "rep_1", role: "MEMBER" as const, nom: "Bob" },
    ];
    expect(managerChoicesForMember(nommes, "rep_1")).toEqual([nommes[0]]);
  });
});

describe("resolveManagerAssignment", () => {
  /*
    Effacer le rattachement est toujours recevable : c'est l'état de départ de
    tout le monde, et un commercial sans manager déclaré est simplement classé
    sur toute l'organisation.
  */
  it("accepts clearing the assignment", () => {
    expect(
      resolveManagerAssignment({
        members: EQUIPE,
        memberUserId: "rep_1",
        managerUserId: null,
      }),
    ).toEqual({ ok: true, managerUserId: null });
  });

  it("accepts a manager of the same organization", () => {
    expect(
      resolveManagerAssignment({
        members: EQUIPE,
        memberUserId: "rep_1",
        managerUserId: "mgr_1",
      }),
    ).toEqual({ ok: true, managerUserId: "mgr_1" });
  });

  /*
    Les deux personnes sont cherchées dans la même liste, qui est celle d'une
    organisation. C'est ce qui empêche de rattacher quelqu'un d'ici à un
    manager d'ailleurs, sans jamais avoir à comparer deux identifiants
    d'organisation.
  */
  it("refuses a member who is not in the list", () => {
    expect(
      resolveManagerAssignment({
        members: EQUIPE,
        memberUserId: "ailleurs_1",
        managerUserId: "mgr_1",
      }),
    ).toEqual({ ok: false, raison: "membre-inconnu" });
  });

  it("refuses a manager who is not in the list", () => {
    expect(
      resolveManagerAssignment({
        members: EQUIPE,
        memberUserId: "rep_1",
        managerUserId: "ailleurs_1",
      }),
    ).toEqual({ ok: false, raison: "manager-inconnu" });
  });

  it("refuses a manager without the role that opens the team view", () => {
    expect(
      resolveManagerAssignment({
        members: EQUIPE,
        memberUserId: "rep_1",
        managerUserId: "rep_2",
      }),
    ).toEqual({ ok: false, raison: "manager-sans-role" });
  });

  it("refuses a person as their own manager", () => {
    expect(
      resolveManagerAssignment({
        members: EQUIPE,
        memberUserId: "mgr_1",
        managerUserId: "mgr_1",
      }),
    ).toEqual({ ok: false, raison: "manager-soi-meme" });
  });

  /*
    Un membre absent est refusé avant tout le reste, y compris avant un
    effacement : la page qui l'affiche est périmée, et lui répondre « c'est
    fait » lui laisserait croire le contraire.
  */
  it("checks the member exists before accepting a clearing", () => {
    expect(
      resolveManagerAssignment({
        members: EQUIPE,
        memberUserId: "ailleurs_1",
        managerUserId: null,
      }),
    ).toEqual({ ok: false, raison: "membre-inconnu" });
  });
});

/*
  Le seul cas qui compte vraiment : la liste proposée à l'écran et la règle qui
  garde l'enregistrement doivent dire la même chose. Si elles divergent, soit le
  menu propose un choix que le serveur refusera, soit il en cache un qui serait
  accepté.
*/
describe("the offered choices and the accepted assignments agree", () => {
  it("accepts exactly what the list offers, for every pair", () => {
    for (const membre of EQUIPE) {
      const offerts = new Set(
        managerChoicesForMember(EQUIPE, membre.userId).map((c) => c.userId),
      );
      for (const candidat of EQUIPE) {
        const accepte = resolveManagerAssignment({
          members: EQUIPE,
          memberUserId: membre.userId,
          managerUserId: candidat.userId,
        }).ok;
        expect(offerts.has(candidat.userId)).toBe(accepte);
      }
    }
  });
});

describe("managerAssignmentRefusalMessage", () => {
  /*
    Une phrase par refus, et aucune vide : la page n'affiche que ce message,
    donc un refus muet passerait pour un enregistrement réussi.
  */
  it("gives a non-empty sentence for every refusal", () => {
    const raisons: ManagerAssignmentRefusal[] = [
      "membre-inconnu",
      "manager-inconnu",
      "manager-sans-role",
      "manager-soi-meme",
    ];
    const phrases = raisons.map(managerAssignmentRefusalMessage);
    for (const phrase of phrases) expect(phrase.length).toBeGreaterThan(0);
    expect(new Set(phrases).size).toBe(raisons.length);
  });
});

/*
  Ce que ces cas ne couvrent pas : l'écriture. Ils tiennent la règle, pas le
  fait qu'un écran pense à la poser ni que le dépôt écrive vraiment le lien.
  Ce dépôt n'a ni jsdom ni testing-library, donc le menu de la page équipe ne
  peut pas être rendu ici, et le client Prisma ne se produit pas dans cet
  environnement. La vérification de bout en bout reste manuelle.

  Ils ne couvrent pas non plus le fait que `managerId` appartient à
  l'utilisateur et non à son appartenance à une organisation : quelqu'un
  présent dans deux organisations n'a qu'un seul manager déclaré. La liste
  reçue ici est déjà cadrée sur une organisation par celui qui appelle.
*/
