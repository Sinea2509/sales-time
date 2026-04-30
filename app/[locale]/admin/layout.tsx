import { redirect } from "next/navigation";
import { AdminShell } from "@/components/templates/admin-shell";
import { makeApplicationDeps } from "@/src/adapters/composition";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }
  const user = await deps.users.findById(principal.userId);
  if (!user?.systemRoles.includes("SUPER_ADMIN")) {
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
