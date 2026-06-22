import { redirect } from "next/navigation";
import { AuthenticatedAppShell } from "@/components/templates/authenticated-app-shell";
import { needsRegisterProfile } from "@/lib/register-profile-gate";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { DEFAULT_TRIAL_LIMIT } from "@/lib/team-seller-scope";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

  const superAdminElevation = await readSuperAdminOrgCookie();
  const actor = await getCurrentActorContext(
    { auth: deps.auth },
    {
      superAdminElevation,
    },
  );

  const trialAnalysesLeft =
    actor.kind === "authenticated" && actor.activeOrganizationId
      ? await deps.organizationQuota.getTrialAnalysesLeft(
          actor.activeOrganizationId,
        )
      : DEFAULT_TRIAL_LIMIT;
  const planUnlocked =
    actor.kind === "authenticated" && actor.activeOrganizationId
      ? await deps.organizationQuota.isPlanUnlocked(actor.activeOrganizationId)
      : false;

  const notificationItems =
    actor.kind === "authenticated"
      ? await deps.notifications.listUnreadForUser(principal.userId, 8)
      : [];
  const unreadNotificationCount =
    actor.kind === "authenticated"
      ? await deps.notifications.countUnreadForUser(principal.userId)
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

  if (
    actor.kind === "authenticated" &&
    actor.isElevatedSuperAdmin &&
    actor.activeOrganizationId &&
    !organizationSwitcherMemberships.some(
      (m) => m.organizationId === actor.activeOrganizationId,
    )
  ) {
    const org = await deps.orgDirectory.getOrganizationById(
      actor.activeOrganizationId,
    );
    if (org) {
      organizationSwitcherMemberships.unshift({
        organizationId: actor.activeOrganizationId,
        name: org.name,
        role: actor.superAdminElevatedRole ?? "ADMIN",
        logoUrl: org.logoUrl ?? null,
      });
    }
  }

  return (
    <AuthenticatedAppShell
      actor={actor}
      superAdminOrgCookie={superAdminElevation?.organizationId ?? null}
      trialAnalysesLeft={trialAnalysesLeft}
      trialLimit={DEFAULT_TRIAL_LIMIT}
      planUnlocked={planUnlocked}
      unreadNotificationCount={unreadNotificationCount}
      notifications={notificationItems.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        href: n.href,
        createdAt: n.createdAt.toISOString(),
      }))}
      organizationSwitcherMemberships={organizationSwitcherMemberships}
    >
      {children}
    </AuthenticatedAppShell>
  );
}
