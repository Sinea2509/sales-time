import type { OrganizationMembershipRole } from "./organization-membership-role";

/**
 * Un membre de l'organisation, réduit à ce que la règle de rattachement
 * regarde : qui il est, et s'il a le rôle qui permet d'encadrer.
 */
export type ManagerAssignmentCandidate = {
  userId: string;
  role: OrganizationMembershipRole;
};

/** Pourquoi un rattachement est refusé. */
export type ManagerAssignmentRefusal =
  | "membre-inconnu"
  | "manager-inconnu"
  | "manager-sans-role"
  | "manager-soi-meme";

export type ManagerAssignment =
  | { ok: true; managerUserId: string | null }
  | { ok: false; raison: ManagerAssignmentRefusal };

/**
 * Qui peut encadrer, dans cette organisation.
 *
 * Le rôle `ADMIN` s'appelle « Manager » à l'écran, et c'est lui qui ouvre la
 * vue d'équipe : `resolveManagerTeamUserIds` ne rend une équipe qu'à celui qui
 * peut administrer l'organisation. Rattacher un commercial à quelqu'un qui n'a
 * pas ce rôle écrirait donc un lien que personne ne lirait jamais.
 *
 * Personne ne s'encadre soi-même : le rattachement se lit ensuite en une seule
 * étape, et un lien sur soi ferait de sa propre fiche sa propre équipe.
 *
 * Les membres reçus ressortent tels quels, avec tout ce qu'ils portent en plus
 * de ce que la règle regarde : l'écran qui appelle a besoin d'un nom à écrire
 * dans son menu, et il l'a déjà.
 */
export function managerChoicesForMember<T extends ManagerAssignmentCandidate>(
  members: readonly T[],
  memberUserId: string,
): T[] {
  return members.filter((m) => m.role === "ADMIN" && m.userId !== memberUserId);
}

/**
 * Le rattachement demandé est-il recevable, et à qui ?
 *
 * Les candidats arrivent en entier plutôt que par identifiant : la liste des
 * membres est déjà cadrée sur une organisation par celui qui appelle, et c'est
 * elle qui répond du même coup aux deux questions que pose un rattachement,
 * « ces deux personnes sont-elles bien d'ici » et « celle-ci peut-elle
 * encadrer ». Une vérification par identifiant les poserait séparément, et
 * pourrait les poser à deux organisations différentes.
 *
 * `null` efface le rattachement : le commercial repasse sans manager déclaré,
 * ce qui est l'état de départ de tout le monde et n'a donc rien à vérifier.
 */
export function resolveManagerAssignment(input: {
  members: readonly ManagerAssignmentCandidate[];
  memberUserId: string;
  managerUserId: string | null;
}): ManagerAssignment {
  const membre = input.members.find((m) => m.userId === input.memberUserId);
  if (!membre) return { ok: false, raison: "membre-inconnu" };

  if (input.managerUserId == null) return { ok: true, managerUserId: null };
  if (input.managerUserId === input.memberUserId) {
    return { ok: false, raison: "manager-soi-meme" };
  }

  const manager = input.members.find((m) => m.userId === input.managerUserId);
  if (!manager) return { ok: false, raison: "manager-inconnu" };
  if (manager.role !== "ADMIN") {
    return { ok: false, raison: "manager-sans-role" };
  }
  return { ok: true, managerUserId: input.managerUserId };
}

/**
 * La phrase rendue au lecteur pour chaque refus.
 *
 * Aucune ne dit « erreur » : ces quatre cas ne se produisent pas en cliquant
 * dans la liste, qui n'offre que des choix recevables. Ils signalent une liste
 * périmée, un membre parti entre-temps, ou un appel fabriqué à la main.
 */
export function managerAssignmentRefusalMessage(
  raison: ManagerAssignmentRefusal,
): string {
  switch (raison) {
    case "membre-inconnu":
      return "Ce membre ne fait plus partie de l'organisation.";
    case "manager-inconnu":
      return "Le manager choisi ne fait plus partie de l'organisation.";
    case "manager-sans-role":
      return "Seul un membre ayant le rôle Manager peut encadrer une équipe.";
    case "manager-soi-meme":
      return "Une personne ne peut pas être son propre manager.";
    default: {
      const _exhaustive: never = raison;
      return _exhaustive;
    }
  }
}
