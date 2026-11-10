import type { ApplicationDeps } from "@/src/adapters/composition";
import { generateFollowUpEmailForMeeting } from "@/src/core/application/generate-follow-up-email";
import { loadResolvedFollowUpEmailPreferences } from "@/src/core/application/load-resolved-follow-up-email-preferences";
import {
  formatFollowUpEmailBody,
  formatFollowUpEmailDraft,
} from "@/src/core/domain/format-follow-up-email-draft";
import type { MeetingDetailWithAnalyses } from "@/src/core/ports/meeting-repository-port";

/**
 * Écrit le mail de suivi d'un rendez-vous et l'enregistre sur la fiche, avec
 * les préférences d'écriture du commercial et de son organisation.
 *
 * La fiche du site et l'application mobile passent par ici : un mail écrit
 * depuis le téléphone est le même que celui du site, et se retrouve sur la
 * fiche.
 *
 * L'accès au rendez-vous est vérifié avant l'appel.
 */
export async function writeFollowUpEmail(
  deps: Pick<
    ApplicationDeps,
    | "analysis"
    | "prompts"
    | "organizationPrompts"
    | "organizationSettings"
    | "organizationTeam"
    | "meetings"
  >,
  input: { organizationId: string; meeting: MeetingDetailWithAnalyses },
): Promise<{ subject: string; body: string; draft: string }> {
  const settings = await deps.organizationSettings.findByOrganizationId(
    input.organizationId,
  );
  const emailPreferences = await loadResolvedFollowUpEmailPreferences(
    { organizationTeam: deps.organizationTeam },
    {
      organizationId: input.organizationId,
      sellerUserId: input.meeting.sellerUserId,
      organizationSettings: settings,
    },
  );

  const email = await generateFollowUpEmailForMeeting(
    {
      analysis: deps.analysis,
      prompts: deps.prompts,
      organizationPrompts: deps.organizationPrompts,
    },
    {
      organizationId: input.organizationId,
      meeting: input.meeting,
      emailPreferences,
    },
  );
  const draft = formatFollowUpEmailDraft(email);

  await deps.meetings.updateMeetingFollowUpDraft({
    id: input.meeting.id,
    organizationId: input.organizationId,
    followUpEmailDraft: draft,
  });

  return {
    subject: email.subject,
    body: formatFollowUpEmailBody(email),
    draft,
  };
}
