import type { ActorContext } from "@/src/core/domain/actor-context";
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
