import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { OrganizationTeamRepositoryPort } from "@/src/core/ports/organization-team-repository-port";

export async function searchOrgEntities(
  deps: {
    meetings: MeetingRepositoryPort;
    contacts: ContactRepositoryPort;
    organizationTeam: OrganizationTeamRepositoryPort;
  },
  input: {
    organizationId: string;
    query: string;
    sellerUserId?: string;
    canManageOrganization: boolean;
  },
) {
  const q = input.query.trim();
  if (q.length < 2) {
    return { meetings: [], contacts: [], members: [] };
  }

  const [meetings, contacts, team] = await Promise.all([
    deps.meetings.searchMeetingsForOrg({
      organizationId: input.organizationId,
      query: q,
      sellerUserId: input.canManageOrganization ? undefined : input.sellerUserId,
      limit: 10,
    }),
    deps.contacts.searchByPrefix({
      organizationId: input.organizationId,
      prefix: q,
      limit: 10,
    }),
    input.canManageOrganization
      ? deps.organizationTeam.listMembersAndPendingInvitations(
          input.organizationId,
        )
      : Promise.resolve({ members: [], pendingInvitations: [] }),
  ]);

  const members = team.members.filter((m) => {
    const hay = `${m.firstName ?? ""} ${m.lastName ?? ""} ${m.email}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return { meetings, contacts, members };
}
