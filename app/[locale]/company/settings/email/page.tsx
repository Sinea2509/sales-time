import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";
import { orgSettingsCanEdit } from "@/lib/org-settings-can-edit";
import { OrgSettingsEmailForm } from "@/components/organisms/org-settings-email-form";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { OrgSettingsReadOnlyBanner } from "@/components/molecules/org-settings-read-only-banner";
import { loadResolvedFollowUpEmailPreferences } from "@/src/core/application/load-resolved-follow-up-email-preferences";
import { resolveFollowUpEmailPreferences } from "@/src/core/domain/follow-up-email-preferences";
import { sectionHeadingClass } from "@/lib/page-typography";

export const dynamic = "force-dynamic";

export default async function OrgSettingsEmailPage() {
  const access = await loadOrgSettingsAccess();
  if (!access) {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const orgId = access.actor.activeOrganizationId!;
  const orgRow = await deps.organizationSettings.findByOrganizationId(orgId);
  const canEditOrganization = orgSettingsCanEdit(access);
  const orgSource = orgRow
    ? {
        emailTone: orgRow.emailTone,
        emailVouvoiement: orgRow.emailVouvoiement,
        emailSignature: orgRow.emailSignature,
      }
    : null;
  const organizationDefaults = resolveFollowUpEmailPreferences({
    organization: orgSource,
    membership: null,
  });

  if (canEditOrganization) {
    return (
      <div className="space-y-6">
        <PageHeaderSimple
          title="E-mail de suivi"
          description="Paramètres organisation utilisés pour la génération du mail de relance (ton, vouvoiement, signature)."
        />
        <OrgSettingsEmailForm
          mode="organization"
          canEdit
          initialTone={organizationDefaults.emailTone}
          initialVouvoiement={organizationDefaults.emailVouvoiement}
          initialSignature={organizationDefaults.emailSignature}
        />
      </div>
    );
  }

  const personalEffective = await loadResolvedFollowUpEmailPreferences(
    { organizationTeam: deps.organizationTeam },
    {
      organizationId: orgId,
      sellerUserId: access.actor.internalUserId,
      organizationSettings: orgRow,
    },
  );

  return (
    <div className="space-y-8">
      <PageHeaderSimple
        title="E-mail de suivi"
        description="Consultez les paramètres organisation et personnalisez vos propres mails de relance."
      />

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Paramètres organisation</h2>
        <OrgSettingsReadOnlyBanner />
        <OrgSettingsEmailForm
          mode="organization"
          canEdit={false}
          initialTone={organizationDefaults.emailTone}
          initialVouvoiement={organizationDefaults.emailVouvoiement}
          initialSignature={organizationDefaults.emailSignature}
        />
      </section>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Ma personnalisation</h2>
        <p className="text-muted-foreground text-sm">
          Ces réglages s&apos;appliquent uniquement à vos mails de relance.
        </p>
        <OrgSettingsEmailForm
          mode="personal"
          canEdit
          initialTone={personalEffective.emailTone}
          initialVouvoiement={personalEffective.emailVouvoiement}
          initialSignature={personalEffective.emailSignature}
        />
      </section>
    </div>
  );
}
