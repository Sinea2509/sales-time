import { redirect } from "next/navigation";
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

  return <div className="mx-auto w-full max-w-6xl p-6">{children}</div>;
}
