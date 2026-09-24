import { OrgSettingsCoachForm } from "@/components/organisms/org-settings-coach-form";
import { OrgSettingsPromptCards } from "@/components/organisms/org-settings-prompt-cards";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { OrgSettingsReadOnlyBanner } from "@/components/molecules/org-settings-read-only-banner";
import { asStringArray } from "@/lib/as-string-array";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";
import { organizationPromptCardView } from "@/lib/organization-prompt-card-view";
import { orgSettingsCanEdit } from "@/lib/org-settings-can-edit";
import { sectionHeadingClass } from "@/lib/page-typography";
import { loadOrganizationPromptCards } from "@/src/core/application/organization-prompt-settings";
import { redirect } from "next/navigation";

export default async function OrganizationSettingsCoachPage() {
  const access = await loadOrgSettingsAccess();
  if (!access) redirect("/company");

  const canEdit = orgSettingsCanEdit(access);
  const orgId = access.actor.activeOrganizationId!;
  const deps = getApplicationDeps();
  const [row, promptCards] = await Promise.all([
    deps.organizationSettings.findByOrganizationId(orgId),
    loadOrganizationPromptCards(deps, { organizationId: orgId }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="Coach IA"
        description="Les consignes du coach, méthode par méthode. Le rôle et le ton s'éditent, les échelles, les règles de preuve et la règle anti-invention sont garanties par le produit."
      />
      {!canEdit ? <OrgSettingsReadOnlyBanner /> : null}
      <OrgSettingsPromptCards
        canEdit={canEdit}
        cards={promptCards.map(organizationPromptCardView)}
      />
      {/*
        Les quatre champs d'avant restent ici en attendant le lot 81, qui les
        range avec le playbook. C'est un écart à la maquette, où ils ne sont
        pas.
      */}
      <section className="space-y-4 pt-4">
        <h2 className={sectionHeadingClass}>Votre argumentaire</h2>
        <OrgSettingsCoachForm
          canEdit={canEdit}
          initial={{
            companyPitch: row?.companyPitch ?? "",
            objections: asStringArray(row?.objections),
            keyArguments: asStringArray(row?.keyArguments),
            industryVocabulary: row?.industryVocabulary ?? "",
          }}
        />
      </section>
    </div>
  );
}
