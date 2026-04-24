import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";

export const dynamic = "force-dynamic";

export default async function SuperAdminAnalyticsPage() {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) redirect("/sign-in");
  const user = await deps.users.findById(principal.userId);
  if (!user || !user.systemRoles.includes("SUPER_ADMIN")) {
    redirect("/company");
  }

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [dau, wau, mau, meetings30d, analyses30d, orgs30d] = await Promise.all([
    prisma.session.groupBy({
      by: ["userId"],
      where: { lastSeenAt: { gte: dayAgo } },
    }).then((r) => r.length),
    prisma.session.groupBy({
      by: ["userId"],
      where: { lastSeenAt: { gte: weekAgo } },
    }).then((r) => r.length),
    prisma.session.groupBy({
      by: ["userId"],
      where: { lastSeenAt: { gte: monthAgo } },
    }).then((r) => r.length),
    prisma.meeting.count({
      where: { createdAt: { gte: monthAgo } },
    }),
    prisma.meetingAnalysis.count({
      where: { createdAt: { gte: monthAgo } },
    }),
    prisma.meeting.groupBy({
      by: ["organizationId"],
      where: { createdAt: { gte: monthAgo } },
    }).then((r) => r.length),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Analytics plateforme
        </h1>
        <Link href="/admin" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Retour
        </Link>
      </div>
      <p className="text-muted-foreground text-sm">
        Indicateurs issus de la base applicative (sessions, RDV, analyses).
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase">DAU</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{dau}</p>
          <p className="text-muted-foreground mt-1 text-xs">Utilisateurs distincts (24h)</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase">WAU</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{wau}</p>
          <p className="text-muted-foreground mt-1 text-xs">7 jours glissants</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase">MAU</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{mau}</p>
          <p className="text-muted-foreground mt-1 text-xs">30 jours glissants</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase">RDV (30j)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{meetings30d}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase">Analyses (30j)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{analyses30d}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase">Orgs actives (30j)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{orgs30d}</p>
          <p className="text-muted-foreground mt-1 text-xs">Avec au moins un RDV créé</p>
        </div>
      </div>
    </div>
  );
}
