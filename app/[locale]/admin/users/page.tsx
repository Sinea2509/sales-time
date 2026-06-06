import { getApplicationDeps } from "@/lib/application-deps";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { AdminUserTable } from "@/components/organisms/admin-user-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { users: serialized, orgOptions } =
    await getApplicationDeps().backoffice.listUsersAndOrgOptionsForAdmin();

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="Utilisateurs"
        description="Gérer les utilisateurs, bloquer/débloquer, modifier les profils et inviter dans des organisations."
      />
      <AdminUserTable users={serialized} organizations={orgOptions} />
    </div>
  );
}
