import { getTranslations } from "next-intl/server";
import { SuperAdminInvitesPanel } from "@/components/organisms/super-admin-invites-panel";
import { NavLinkButton } from "@/components/molecules/nav-link-button";
import { PageHeader } from "@/components/molecules/page-header";
import { getApplicationDeps } from "@/lib/application-deps";

export const dynamic = "force-dynamic";

export default async function SuperAdminInvitesPage() {
  const t = await getTranslations("superAdminInvitesPage");
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return null;

  const [superAdmins, invitations] = await Promise.all([
    deps.backoffice.listSuperAdminRolesWithUsers(),
    deps.backoffice.listPendingSuperAdminInvitations(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <NavLinkButton href="/admin" variant="outline" size="sm">
            {t("backToOrgs")}
          </NavLinkButton>
        }
      />
      <SuperAdminInvitesPanel
        currentUserId={principal.userId}
        superAdmins={superAdmins}
        invitations={invitations}
      />
    </div>
  );
}
