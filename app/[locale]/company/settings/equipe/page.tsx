import { redirect } from "next/navigation";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
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
    { superAdminElevatedOrganizationId: superAdminOrg },
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Équipe & accès</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Membres de l’organisation, rôles (administrateur / membre) et invitations
          par e-mail. Les invitations utilisent le même flux que l’onboarding.
        </p>
      </div>

      <OrgSettingsTeamList
        members={memberRows}
        invitations={invRows}
        currentUserId={principal.userId}
      />
    </div>
  );
}
