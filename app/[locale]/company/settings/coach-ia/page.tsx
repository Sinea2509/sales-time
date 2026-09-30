import { OrgSettingsPromptCards } from "@/components/organisms/org-settings-prompt-cards";
import { OrgSettingsReadOnlyBanner } from "@/components/molecules/org-settings-read-only-banner";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";
import { organizationPromptCardView } from "@/lib/organization-prompt-card-view";
import { orgSettingsCanEdit } from "@/lib/org-settings-can-edit";
import { loadOrganizationPromptCards } from "@/src/core/application/organization-prompt-settings";
import { redirect } from "next/navigation";

/**
 * L'onglet Coach IA de la maquette : l'encart, puis les six consignes. Le
 * titre et le sous-titre viennent du gabarit des paramètres ; l'argumentaire
 * (pitch, objections, arguments, vocabulaire) vit avec le playbook.
 */
export default async function OrganizationSettingsCoachPage() {
  const access = await loadOrgSettingsAccess();
  if (!access) redirect("/company");

  const canEdit = orgSettingsCanEdit(access);
  const orgId = access.actor.activeOrganizationId!;
  const deps = getApplicationDeps();
  const promptCards = await loadOrganizationPromptCards(deps, {
    organizationId: orgId,
  });

  return (
    <div className="space-y-6">
      {!canEdit ? <OrgSettingsReadOnlyBanner /> : null}
      <OrgSettingsPromptCards
        canEdit={canEdit}
        organizationId={orgId}
        cards={promptCards.map(organizationPromptCardView)}
      />
    </div>
  );
}
