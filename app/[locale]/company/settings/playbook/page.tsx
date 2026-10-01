import { OrgSettingsCoachForm } from "@/components/organisms/org-settings-coach-form";
import { OrgSettingsPlaybookForm } from "@/components/organisms/org-settings-playbook-form";
import { OrgSettingsReadOnlyBanner } from "@/components/molecules/org-settings-read-only-banner";
import { asStringArray } from "@/lib/as-string-array";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";
import { organizationPlaybookMarkdownForAnalysis } from "@/lib/organization-playbook-for-analysis";
import { orgSettingsCanEdit } from "@/lib/org-settings-can-edit";
import { sectionHeadingClass } from "@/lib/page-typography";
import { organizationPlaybookFromJson } from "@/src/core/domain/organization-playbook";
import { redirect } from "next/navigation";

export default async function OrganizationSettingsPlaybookPage() {
  const access = await loadOrgSettingsAccess();
  if (!access) redirect("/company");

  const canEdit = orgSettingsCanEdit(access);
  const orgId = access.actor.activeOrganizationId!;
  const deps = getApplicationDeps();
  const row = await deps.organizationSettings.findByOrganizationId(orgId);

  /*
    L'aperçu passe par la fonction qu'utilisent réellement les analyses, et non
    par un rendu refait pour l'écran. Un aperçu qui diverge du prompt envoyé
    serait pire que pas d'aperçu du tout : il donnerait confiance dans un texte
    que le modèle ne lit pas.
  */
  const promptPreview = organizationPlaybookMarkdownForAnalysis(row);

  return (
    <div className="space-y-6">
      {!canEdit ? <OrgSettingsReadOnlyBanner /> : null}
      <OrgSettingsPlaybookForm
        canEdit={canEdit}
        initial={organizationPlaybookFromJson(row?.playbook)}
        promptPreview={promptPreview}
      />
      {/*
        L'argumentaire (pitch, objections, arguments clés, vocabulaire) vit avec
        le playbook : la maquette ne le montre pas sous les consignes du coach,
        et il raconte, lui aussi, comment l'organisation vend.
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
