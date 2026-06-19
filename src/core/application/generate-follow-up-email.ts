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
