import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";
import { OrgSettingsEmailForm } from "@/components/organisms/org-settings-email-form";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { loadResolvedFollowUpEmailPreferences } from "@/src/core/application/load-resolved-follow-up-email-preferences";
import type { FollowUpEmailTone } from "@/src/core/domain/follow-up-email-preferences";

export const dynamic = "force-dynamic";

export default async function OrgSettingsEmailPage() {
  const access = await loadOrgSettingsAccess();
  if (!access) {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const orgId = access.actor.activeOrganizationId!;
  const orgRow = await deps.organizationSettings.findByOrganizationId(orgId);
  const useOrganizationSettings = access.canManageOrganizationSettings;

  const effective: {
    emailTone: FollowUpEmailTone;
    emailVouvoiement: boolean;
    emailSignature: string | null;
  } = useOrganizationSettings
    ? {
        emailTone: orgRow?.emailTone === "informal" ? "informal" : "formal",
        emailVouvoiement: orgRow?.emailVouvoiement ?? true,
        emailSignature: orgRow?.emailSignature ?? null,
      }
    : await loadResolvedFollowUpEmailPreferences(
        { organizationTeam: deps.organizationTeam },
        {
          organizationId: orgId,
          sellerUserId: access.actor.internalUserId,
          organizationSettings: orgRow,
        },
      );

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="E-mail de suivi"
        description={
          useOrganizationSettings
            ? "Paramètres organisation utilisés pour la génération du mail de relance (ton, vouvoiement, signature)."
            : "Personnalisez votre ton, vouvoiement et signature pour vos mails de relance. Les valeurs par défaut de l’organisation s’appliquent tant que vous ne les remplacez pas."
        }
      />
      <OrgSettingsEmailForm
        mode={useOrganizationSettings ? "organization" : "personal"}
        initialTone={effective.emailTone}
        initialVouvoiement={effective.emailVouvoiement}
        initialSignature={effective.emailSignature}
      />
    </div>
  );
}
