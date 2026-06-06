import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { AdminUserDetailShell } from "@/components/organisms/admin-user-detail-shell";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const user = await getApplicationDeps().backoffice.getUserDetailForAdmin(id);

  if (!user) {
    redirect("/admin/users");
  }

  return <AdminUserDetailShell user={user} />;
}
