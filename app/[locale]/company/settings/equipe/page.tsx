import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import {
  OrgSettingsTeamList,
  type TeamInvitationRow,
  type TeamMemberRow,
} from "@/components/organisms/org-settings-team-list";

export const dynamic = "force-dynamic";

export default async function OrganizationSettingsEquipePage() {
  const deps = makeApplicationDeps();
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

  const [memberships, invitations] = await Promise.all([
    prisma.organizationMembership.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organizationInvitation.findMany({
      where: {
        organizationId: orgId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const members: TeamMemberRow[] = memberships.map((m) => ({
    membershipId: m.id,
    userId: m.user.id,
    email: m.user.email,
    firstName: m.user.firstName,
    lastName: m.user.lastName,
    role: m.role,
    joinedAt: m.createdAt.toISOString(),
  }));

  const invRows: TeamInvitationRow[] = invitations.map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    expiresAt: i.expiresAt.toISOString(),
    createdAt: i.createdAt.toISOString(),
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
        members={members}
        invitations={invRows}
        currentUserId={principal.userId}
      />
    </div>
  );
}
