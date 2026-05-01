import { redirect } from "next/navigation";
import { AuthenticatedAppShell } from "@/components/templates/authenticated-app-shell";
import { needsRegisterProfile } from "@/lib/register-profile-gate";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }

  const userRow = await deps.users.findUserWithOnboardingByUserId(
    principal.userId,
  );
  const isSuperAdmin = Boolean(
    userRow?.systemRoles.some((r) => r === "SUPER_ADMIN"),
  );
  if (!isSuperAdmin && userRow && needsRegisterProfile(userRow)) {
    redirect("/register/profile");
  }
  if (!isSuperAdmin && !userRow?.onboardingProfile?.completedAt) {
    redirect("/onboarding");
  }

  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const actor = await getCurrentActorContext(
    { auth: deps.auth },
    {
      superAdminElevatedOrganizationId: superAdminOrgCookie,
    },
  );

  const analysesUsed =
    actor.kind === "authenticated" && actor.activeOrganizationId
      ? await deps.meetings.countMeetingAnalysesForOrganization(
          actor.activeOrganizationId,
        )
      : 0;

  const organizationSwitcherMemberships = await Promise.all(
    principal.memberships.map(async (m) => {
      const org = await deps.orgDirectory.getOrganizationById(m.organizationId);
      return {
        organizationId: m.organizationId,
        name: org?.name ?? m.organizationId,
        role: m.role,
        logoUrl: org?.logoUrl ?? null,
      };
    }),
  );

  return (
    <AuthenticatedAppShell
      actor={actor}
      superAdminOrgCookie={superAdminOrgCookie}
      analysesUsed={analysesUsed}
      organizationSwitcherMemberships={organizationSwitcherMemberships}
    >
      {children}
    </AuthenticatedAppShell>
  );
}
