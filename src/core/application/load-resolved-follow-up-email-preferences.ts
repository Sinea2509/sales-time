import type { FollowUpEmailPreferenceSource } from "../domain/follow-up-email-preferences";
import type { OrganizationSettingsRow } from "../ports/organization-settings-repository-port";
import type { OrganizationTeamRepositoryPort } from "../ports/organization-team-repository-port";
import {
  resolveFollowUpEmailPreferences,
  type ResolvedFollowUpEmailPreferences,
} from "../domain/follow-up-email-preferences";

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

  const orgSource: FollowUpEmailPreferenceSource | null = input.organizationSettings
    ? {
        emailTone: input.organizationSettings.emailTone,
        emailVouvoiement: input.organizationSettings.emailVouvoiement,
        emailSignature: input.organizationSettings.emailSignature,
      }
    : null;

  return resolveFollowUpEmailPreferences({
    organization: orgSource,
    membership,
  });
}
