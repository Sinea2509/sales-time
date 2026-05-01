import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SuperAdminInvitesPanel } from "@/components/organisms/super-admin-invites-panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={pageTitleClass}>{t("title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("description")}
          </p>
        </div>
        <Link
          href="/admin"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {t("backToOrgs")}
        </Link>
      </div>
      <SuperAdminInvitesPanel
        currentUserId={principal.userId}
        superAdmins={superAdmins}
        invitations={invitations}
      />
    </div>
  );
}
