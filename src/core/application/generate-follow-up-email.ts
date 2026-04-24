import { DEFAULT_FOLLOW_UP_EMAIL_SYSTEM } from "@/lib/default-analysis-prompts";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { MeetingDetailWithAnalyses } from "@/src/core/ports/meeting-repository-port";
import type { OrganizationSettingsRow } from "@/src/core/ports/organization-settings-repository-port";

function xml(tag: string, body: string) {
  return `<${tag}>\n${body}\n</${tag}>`;
}

export async function generateFollowUpEmailForMeeting(
  deps: { analysis: AnalysisPort },
  input: {
    meeting: MeetingDetailWithAnalyses;
    organizationSettings: OrganizationSettingsRow | null;
    model: string;
  },
) {
  const s = input.organizationSettings;
  const prefs = [
    xml(
      "email_preferences",
      [
        `emailTone: ${s?.emailTone ?? "formal"}`,
        `emailVouvoiement: ${s?.emailVouvoiement !== false ? "true" : "false"}`,
        s?.emailSignature
          ? `emailSignature:\n${s.emailSignature}`
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

  const { result } = await deps.analysis.generateFollowUpEmail({
    systemMarkdown: DEFAULT_FOLLOW_UP_EMAIL_SYSTEM,
    userContent: prefs,
    model: input.model,
  });
  return result;
}
