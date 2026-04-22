import Link from "next/link";
import { SuperAdminOrgList } from "@/components/organisms/super-admin-org-list";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { listOrganizationsForSuperAdmin } from "@/src/core/application/list-organizations-for-super-admin";

export default async function SuperAdminPage() {
  const deps = makeApplicationDeps();
  const result = await listOrganizationsForSuperAdmin(deps, { limit: 100 });

  if (!result.ok) {
    return (
      <div className="rounded-lg border border-border p-6">
        <h1 className="text-lg font-semibold">Super admin</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          You do not have access to this area, or your user is not synced to
          the application database yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/dashboard/super-admin/prompts"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Prompts SONCAS / DISC
        </Link>
      </div>
      <SuperAdminOrgList organizations={result.organizations} />
    </div>
  );
}
