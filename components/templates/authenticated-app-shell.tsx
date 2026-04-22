import type { ActorContext } from "@/src/core/domain/actor-context";
import { AdminSidebar } from "@/components/organisms/admin-sidebar";
import { DashboardHeader } from "@/components/organisms/dashboard-header";

type Props = {
  actor: ActorContext;
  superAdminOrgCookie: string | null;
  children: React.ReactNode;
};

export function AuthenticatedAppShell({
  actor,
  superAdminOrgCookie,
  children,
}: Props) {
  const showSuperAdminNav =
    actor.kind === "authenticated" &&
    actor.systemRoles.includes("SUPER_ADMIN");

  const isElevatedSuperAdmin =
    actor.kind === "authenticated" && actor.isElevatedSuperAdmin;

  const showOrganizationShellSidebar =
    actor.kind === "authenticated" && Boolean(actor.activeTenantClerkOrgId);

  if (showOrganizationShellSidebar && actor.kind === "authenticated") {
    return (
      <div className="bg-[var(--app-shell-surface)] flex min-h-screen">
        <AdminSidebar
          showSuperAdminNav={showSuperAdminNav}
          activeTenantClerkOrgId={actor.activeTenantClerkOrgId}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            showSuperAdminNav={showSuperAdminNav}
            isElevatedSuperAdmin={isElevatedSuperAdmin}
            elevatedClerkOrgId={superAdminOrgCookie}
          />
          <main className="flex-1 p-6">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader
        showSuperAdminNav={showSuperAdminNav}
        isElevatedSuperAdmin={isElevatedSuperAdmin}
        elevatedClerkOrgId={superAdminOrgCookie}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
    </div>
  );
}
