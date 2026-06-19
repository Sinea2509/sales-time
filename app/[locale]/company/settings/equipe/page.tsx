import { redirect } from "next/navigation";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import {
  OrgSettingsTeamList,
  type TeamInvitationRow,
  type TeamMemberRow,
} from "@/components/organisms/org-settings-team-list";

export const dynamic = "force-dynamic";

export default async function OrganizationSettingsEquipePage() {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) redirect("/sign-in");

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: superAdminOrg },
  );
  if (
    ctx.kind !== "authenticated" ||
    !ctx.activeOrganizationId ||
    !ctx.canManageOrganization
  ) {
    redirect("/company");
  }

  const orgId = ctx.activeOrganizationId;

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
        currentUserId={principal.userId}
        currentUserEmail={principal.email}
      />
    </div>
  );
}
