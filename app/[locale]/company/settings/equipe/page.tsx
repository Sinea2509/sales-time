import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import {
  OrgSettingsTeamList,
  type TeamInvitationRow,
  type TeamMemberRow,
} from "@/components/organisms/org-settings-team-list";

export const dynamic = "force-dynamic";

export default async function OrganizationSettingsEquipePage() {
  const access = await loadOrgSettingsAccess();
  if (!access) {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const orgId = access.actor.activeOrganizationId!;

  const { members, invitations } =
    await deps.organizationTeam.listMembersAndPendingInvitations(orgId);

  const memberRows: TeamMemberRow[] = members.map((m) => ({
    membershipId: m.membershipId,
    userId: m.userId,
    email: m.email,
    firstName: m.firstName,
    lastName: m.lastName,
    role: m.role,
    joinedAt: m.joinedAt,
    managerUserId: m.managerUserId,
  }));

  const invRows: TeamInvitationRow[] = invitations.map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    expiresAt: i.expiresAt,
    createdAt: i.createdAt,
  }));

  return (
    <div className="space-y-6">
      <PageHeaderSimple title="Équipe & accès" />

      <OrgSettingsTeamList
        members={memberRows}
        invitations={invRows}
        currentUserId={access.actor.internalUserId}
        currentUserEmail={access.actor.email}
        canManageTeam={access.canManageOrganizationSettings}
      />
    </div>
  );
}
