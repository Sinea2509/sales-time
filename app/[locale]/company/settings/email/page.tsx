import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { OrgSettingsEmailForm } from "@/components/organisms/org-settings-email-form";
import { PageHeaderSimple } from "@/components/molecules/page-header";

export const dynamic = "force-dynamic";

export default async function OrgSettingsEmailPage() {
  const actor = await requireDashboardActor();
  if (
    actor.kind !== "authenticated" ||
    !actor.activeOrganizationId ||
    !actor.canAccessOrganizationSettings
  ) {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const row = await deps.organizationSettings.findByOrganizationId(
    actor.activeOrganizationId,
  );

  const tone =
    row?.emailTone === "informal" || row?.emailTone === "formal"
      ? row.emailTone
      : null;

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="E-mail de suivi"
        description="Paramètres utilisés pour la génération du mail de relance (ton, vouvoiement, signature)."
      />
      <OrgSettingsEmailForm
        initialTone={tone}
        initialVouvoiement={row?.emailVouvoiement ?? true}
        initialSignature={row?.emailSignature ?? null}
      />
    </div>
  );
}
