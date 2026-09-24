import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { OrganizationPromptRepositoryPort } from "@/src/core/ports/organization-prompt-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { MeetingDetailWithAnalyses } from "@/src/core/ports/meeting-repository-port";
import type { ResolvedFollowUpEmailPreferences } from "@/src/core/domain/follow-up-email-preferences";
import { APP_TIME_ZONE } from "@/src/core/domain/app-time-zone";
import { resolveAnalysisPrompt } from "./resolve-analysis-prompt";

function xml(tag: string, body: string) {
  return `<${tag}>\n${body}\n</${tag}>`;
}

/*
  En heure de Paris, comme toute l'application : l'heure saisie dans le
  formulaire est lue dans ce fuseau, et un rendez-vous tard le soir garde son
  jour, et le bon jour de la semaine.
*/
const meetingDate = new Intl.DateTimeFormat("fr-FR", {
  timeZone: APP_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Ce que la fiche sait du rendez-vous, en tête du message.
 *
 * Sans la date, un modèle qui veut dater le mail la prend où il la trouve :
 * au premier essai en production, il a recopié celle que sa consigne donnait
 * en exemple. Avec elle, il peut écrire « suite à notre rendez-vous de jeudi »
 * sans rien inventer, et la consigne lui interdit d'en déduire d'autres dates.
 */
export function meetingContextBlock(
  meeting: Pick<
    MeetingDetailWithAnalyses,
    "meetingAt" | "prospectName" | "prospectCompany" | "meetingType"
  >,
): string {
  return xml(
    "meeting",
    [
      `meetingDate: ${meetingDate.format(meeting.meetingAt)}`,
      `prospectName: ${meeting.prospectName}`,
      meeting.prospectCompany
        ? `prospectCompany: ${meeting.prospectCompany}`
        : "",
      meeting.meetingType ? `meetingType: ${meeting.meetingType}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

export async function generateFollowUpEmailForMeeting(
  deps: {
    analysis: AnalysisPort;
    prompts: PromptTemplateRepositoryPort;
    /** La consigne du mail, quand l'organisation a modifié la sienne. */
    organizationPrompts: OrganizationPromptRepositoryPort;
  },
  input: {
    /** L'organisation de la session, celle du rendez-vous. */
    organizationId: string;
    meeting: MeetingDetailWithAnalyses;
    emailPreferences: ResolvedFollowUpEmailPreferences;
  },
) {
  const prefs = [
    meetingContextBlock(input.meeting),
    xml(
      "email_preferences",
      [
        `emailTone: ${input.emailPreferences.emailTone}`,
        `emailVouvoiement: ${input.emailPreferences.emailVouvoiement ? "true" : "false"}`,
        input.emailPreferences.emailSignature
          ? `emailSignature:\n${input.emailPreferences.emailSignature}`
          : "emailSignature: (none)",
      ].join("\n"),
    ),
    xml("transcript", input.meeting.transcript),
    input.meeting.notes ? xml("internal_notes", input.meeting.notes) : "",
    ...input.meeting.analyses.map((a) =>
      xml(`analysis_${a.kind}`, JSON.stringify(a.result)),
    ),
  ]
    .filter(Boolean)
    .join("\n\n");

  const prompt = await resolveAnalysisPrompt(deps, {
    kind: "FOLLOW_UP_EMAIL",
    organizationId: input.organizationId,
  });
  const model = await resolvePromptGatewayModel(deps.prompts, "FOLLOW_UP_EMAIL");

  const { result } = await deps.analysis.generateFollowUpEmail({
    systemMarkdown: prompt.markdown,
    userContent: prefs,
    model,
  });
  return result;
}
