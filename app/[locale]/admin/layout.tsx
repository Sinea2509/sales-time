import { redirect } from "next/navigation";
import { AdminShell } from "@/components/templates/admin-shell";
import { getApplicationDeps } from "@/lib/application-deps";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }
  const user = await deps.users.findById(principal.userId);
  if (!user) {
    redirect("/sign-in");
  }
  if (!user.systemRoles.includes("SUPER_ADMIN")) {
    redirect("/company");
  }

  return (
    <AdminShell
      userEmail={user.email}
    >
      {children}
    </AdminShell>
  );
}
