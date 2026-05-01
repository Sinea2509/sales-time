import type { ActorContext } from "@/src/core/domain/actor-context";
import { DashboardHeader } from "@/components/organisms/dashboard-header";
import type { OrgSwitcherMembership } from "@/components/organisms/org-switcher";
import { OrgDashboardShell } from "@/components/templates/org-dashboard-shell";

type Props = {
  actor: ActorContext;
  superAdminOrgCookie: string | null;
  analysesUsed: number;
  organizationSwitcherMemberships?: OrgSwitcherMembership[];
  children: React.ReactNode;
};

export function AuthenticatedAppShell({
  actor,
  superAdminOrgCookie,
  analysesUsed,
  organizationSwitcherMemberships = [],
  children,
}: Props) {
  const showSuperAdminNav =
    actor.kind === "authenticated" && actor.systemRoles.includes("SUPER_ADMIN");

  const isElevatedSuperAdmin =
    actor.kind === "authenticated" && actor.isElevatedSuperAdmin;

  if (actor.kind === "authenticated") {
    return (
      <OrgDashboardShell
        showSuperAdminNav={showSuperAdminNav}
        isElevatedSuperAdmin={isElevatedSuperAdmin}
        elevatedOrganizationId={superAdminOrgCookie}
        activeOrganizationId={actor.activeOrganizationId}
        workspaceRoleMode={actor.workspaceRoleMode}
        analysesUsed={analysesUsed}
        organizationSwitcherMemberships={organizationSwitcherMemberships}
        sessionUser={{
          firstName: actor.firstName,
          lastName: actor.lastName,
          email: actor.email,
        }}
      >
        {children}
      </OrgDashboardShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader
        showSuperAdminNav={showSuperAdminNav}
        isElevatedSuperAdmin={isElevatedSuperAdmin}
        elevatedOrganizationId={superAdminOrgCookie}
        sessionUser={null}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
    </div>
  );
}
