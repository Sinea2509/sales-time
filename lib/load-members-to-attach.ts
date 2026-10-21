import { membersToAttach } from "@/src/core/domain/manager-assignment";
import type { OrganizationTeamRepositoryPort } from "@/src/core/ports/organization-team-repository-port";

/** Un commercial rattaché à personne, tel que la carte « à rattacher » le montre. */
export type MemberToAttach = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

/**
 * Les commerciaux qu'un manager peut ajouter à son équipe, prêts pour la carte
 * « à rattacher ». Une liste vide quand le lecteur n'encadre pas, ou quand une
 * lecture échoue : la carte est une aide, elle ne doit jamais casser la page.
 */
export async function loadMembersToAttach(
  deps: { organizationTeam: OrganizationTeamRepositoryPort },
  input: { organizationId: string; managerUserId: string | null },
): Promise<MemberToAttach[]> {
  if (!input.managerUserId) return [];
  try {
    const { members } =
      await deps.organizationTeam.listMembersAndPendingInvitations(
        input.organizationId,
      );
    const manager = members.find((m) => m.userId === input.managerUserId);
    if (manager?.role !== "ADMIN") return [];
    return membersToAttach(members, input.managerUserId).map((m) => ({
      userId: m.userId,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
    }));
  } catch {
    return [];
  }
}
