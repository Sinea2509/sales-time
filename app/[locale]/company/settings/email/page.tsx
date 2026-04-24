import { redirect } from "next/navigation";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { OrgSettingsEmailForm } from "@/components/org-settings/org-settings-email-form";

export const dynamic = "force-dynamic";

export default async function OrgSettingsEmailPage() {
  const actor = await requireDashboardActor();
  if (
    actor.kind !== "authenticated" ||
    !actor.activeOrganizationId ||
    !actor.canManageOrganization
  ) {
    redirect("/company");
  }

  const deps = makeApplicationDeps();
  const row = await deps.organizationSettings.findByOrganizationId(
    actor.activeOrganizationId,
  );

  const tone =
    row?.emailTone === "informal" || row?.emailTone === "formal"
      ? row.emailTone
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">E-mail de suivi</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Paramètres utilisés pour la génération du mail de relance (ton,
          vouvoiement, signature).
        </p>
      </div>
      <OrgSettingsEmailForm
        initialTone={tone}
        initialVouvoiement={row?.emailVouvoiement ?? true}
        initialSignature={row?.emailSignature ?? null}
      />
    </div>
  );
}
