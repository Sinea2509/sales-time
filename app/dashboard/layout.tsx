import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthenticatedAppShell } from "@/components/templates/authenticated-app-shell";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { ensureClerkUserSynced } from "@/src/adapters/prisma/sync-clerk-user";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  await ensureClerkUserSynced(userId);

  const userRow = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      onboardingProfile: true,
      systemRoles: true,
    },
  });
  const isSuperAdmin = Boolean(
    userRow?.systemRoles.some((r) => r.role === "SUPER_ADMIN"),
  );
  if (!isSuperAdmin && !userRow?.onboardingProfile?.completedAt) {
    redirect("/onboarding");
  }

  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const actor = await getCurrentActorContext(makeApplicationDeps(), {
    superAdminActiveClerkOrgId: superAdminOrgCookie,
  });

  const analysesUsed =
    actor.kind === "authenticated" && actor.activeTenantClerkOrgId
      ? await prisma.meetingAnalysis.count({
          where: { meeting: { clerkOrgId: actor.activeTenantClerkOrgId } },
        })
      : 0;

  return (
    <AuthenticatedAppShell
      actor={actor}
      superAdminOrgCookie={superAdminOrgCookie}
      analysesUsed={analysesUsed}
    >
      {children}
    </AuthenticatedAppShell>
  );
}
