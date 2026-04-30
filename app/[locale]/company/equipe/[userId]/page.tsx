import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { getApplicationDeps } from "@/lib/application-deps";

export const dynamic = "force-dynamic";

export default async function ManagerCommercialViewPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }
  if (actor.workspaceRoleMode !== "admin") {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const member = await deps.organizationTeam.findMembershipForManagerView(
    actor.activeOrganizationId,
    userId,
  );
  if (!member) notFound();

  const display =
    [member.user.firstName, member.user.lastName].filter(Boolean).join(" ").trim() ||
    member.user.email;

  return (
    <div className="space-y-6">
      <Link href="/company" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
        ← Tableau de bord
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vue commercial</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {display} · {member.user.email} · rôle {member.role}
        </p>
      </div>
      <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
        Vue manager (MVP) : agrégations détaillées (KISS thématiques, TAM par
        commercial) arriveront dans les prochaines itérations. Utilisez la liste
        des rendez-vous filtrée par vendeur depuis l’administration des RDV.
      </p>
    </div>
  );
}
