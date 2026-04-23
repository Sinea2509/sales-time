import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SuperAdminOrgList } from "@/components/organisms/super-admin-org-list";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { listOrganizationsForSuperAdmin } from "@/src/core/application/list-organizations-for-super-admin";

export default async function SuperAdminPage() {
  const t = await getTranslations("superAdminPage");
  const deps = makeApplicationDeps();
  const result = await listOrganizationsForSuperAdmin(
    { auth: deps.auth, orgDirectory: deps.orgDirectory },
    { limit: 100 },
  );

  if (!result.ok) {
    return (
      <div className="rounded-lg border border-border p-6">
        <h1 className="text-lg font-semibold">{t("accessDeniedTitle")}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t("accessDeniedBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/admin/prompts"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {t("promptsLink")}
        </Link>
      </div>
      <SuperAdminOrgList organizations={result.organizations} />
    </div>
  );
}
