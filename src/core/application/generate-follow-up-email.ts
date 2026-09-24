import {
  loadAnalysisPromptMarkdown,
} from "@/lib/load-analysis-prompt";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { MeetingDetailWithAnalyses } from "@/src/core/ports/meeting-repository-port";
import type { ResolvedFollowUpEmailPreferences } from "@/src/core/domain/follow-up-email-preferences";

function xml(tag: string, body: string) {
  return `<${tag}>\n${body}\n</${tag}>`;
}

/*
  Pas de fuseau imposé, comme l'en-tête de la fiche : le formulaire envoie
  l'heure saisie sans fuseau et le serveur la lit dans le sien. L'écrire dans
  un autre fuseau donnerait le lendemain, et un mauvais jour de la semaine,
  aux rendez-vous saisis tard le soir.
*/
const meetingDate = new Intl.DateTimeFormat("fr-FR", {
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
  },
  input: {
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

  const systemMarkdown = await loadAnalysisPromptMarkdown(
    deps.prompts,
    "FOLLOW_UP_EMAIL",
  );
  const model = await resolvePromptGatewayModel(deps.prompts, "FOLLOW_UP_EMAIL");

  const { result } = await deps.analysis.generateFollowUpEmail({
    systemMarkdown,
    userContent: prefs,
    model,
  });
  return result;
}
