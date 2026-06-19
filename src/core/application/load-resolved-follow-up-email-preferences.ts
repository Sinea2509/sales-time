import type { FollowUpEmailPreferenceSource } from "../domain/follow-up-email-preferences";
import type { OrganizationSettingsRow } from "../ports/organization-settings-repository-port";
import type { OrganizationTeamRepositoryPort } from "../ports/organization-team-repository-port";
import {
  resolveFollowUpEmailPreferences,
  type ResolvedFollowUpEmailPreferences,
} from "../domain/follow-up-email-preferences";

function organizationSettingsToPreferenceSource(
  settings: OrganizationSettingsRow | null,
): FollowUpEmailPreferenceSource | null {
  if (!settings) return null;
  return {
    emailTone: settings.emailTone,
    emailVouvoiement: settings.emailVouvoiement,
    emailSignature: settings.emailSignature,
  };
}

export async function loadResolvedFollowUpEmailPreferences(
  deps: {
    organizationTeam: OrganizationTeamRepositoryPort;
  },
  input: {
    organizationId: string;
    sellerUserId: string;
    organizationSettings: OrganizationSettingsRow | null;
  },
): Promise<ResolvedFollowUpEmailPreferences> {
  const membership =
    await deps.organizationTeam.findMembershipFollowUpEmailPreferences(
      input.sellerUserId,
      input.organizationId,
    );

  return resolveFollowUpEmailPreferences({
    organization: organizationSettingsToPreferenceSource(
      input.organizationSettings,
    ),
    membership,
  });
}
