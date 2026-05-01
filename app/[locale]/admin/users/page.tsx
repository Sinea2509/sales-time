import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";
import { AdminUserTable } from "@/components/organisms/admin-user-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { users: serialized, orgOptions } =
    await getApplicationDeps().backoffice.listUsersAndOrgOptionsForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClass}>Utilisateurs</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gérer les utilisateurs, bloquer/débloquer, modifier les profils et
          inviter dans des organisations.
        </p>
      </div>
      <AdminUserTable users={serialized} organizations={orgOptions} />
    </div>
  );
}
