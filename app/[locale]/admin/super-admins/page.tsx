import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SuperAdminInvitesPanel } from "@/components/organisms/super-admin-invites-panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";

export const dynamic = "force-dynamic";

export default async function SuperAdminInvitesPage() {
  const t = await getTranslations("superAdminInvitesPage");
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { id: principal.userId },
    select: { systemRoles: { select: { role: true } } },
  });
  if (!user?.systemRoles.some((r) => r.role === "SUPER_ADMIN")) {
    return null;
  }

  const superAdminRoles = await prisma.systemRole.findMany({
    where: { role: "SUPER_ADMIN" },
    orderBy: { createdAt: "asc" },
    select: {
      userId: true,
      createdAt: true,
      user: {
        select: { email: true, firstName: true, lastName: true },
      },
    },
  });

  const superAdmins = superAdminRoles.map((r) => ({
    userId: r.userId,
    email: r.user.email,
    firstName: r.user.firstName,
    lastName: r.user.lastName,
    grantedAt: r.createdAt.toISOString(),
  }));

  const rows = await prisma.superAdminInvitation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, createdAt: true, expiresAt: true },
  });

  const invitations = rows.map((r) => ({
    id: r.id,
    email: r.email,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
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
