import { loadAnalysisPromptMarkdown } from "@/lib/load-analysis-prompt";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import { organizationPlaybookMarkdownForAnalysis } from "@/lib/organization-playbook-for-analysis";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { OrganizationSettingsRepositoryPort } from "@/src/core/ports/organization-settings-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import { composeAnalysisSystemMarkdown } from "@/src/core/domain/analysis-system-markdown";
import { toAppTimeZoneDatetimeLocal } from "@/src/core/domain/app-time-zone";
import { withProvableAnswers } from "@/src/core/domain/likely-objection-proof";
import { meetingBriefingHistoryEntry } from "@/src/core/domain/meeting-briefing";
import { referenceNamesInstruction } from "@/src/core/domain/reference-names";

export async function prepareMeetingBriefing(
  deps: {
    meetings: MeetingRepositoryPort;
    contacts: ContactRepositoryPort;
    analysis: AnalysisPort;
    prompts: PromptTemplateRepositoryPort;
    organizationSettings: Pick<
      OrganizationSettingsRepositoryPort,
      "findByOrganizationId"
    >;
  },
  input: {
    organizationId: string;
    personId: string;
    targetStage: string;
    /**
     * Restreint aux contacts de ce commercial, et à ses propres rendez-vous
     * avec ce contact : l'historique ne lui apprend rien de ceux d'un collègue
     * (voir `contactsVisibleTo`).
     */
    visibleTo?: string;
  },
) {
  const person = await deps.contacts.findById({
    id: input.personId,
    organizationId: input.organizationId,
    visibleTo: input.visibleTo,
  });
  if (!person) return null;

  const [history, settings] = await Promise.all([
    deps.meetings.listMeetingsForPersonOrdered({
      organizationId: input.organizationId,
      personId: input.personId,
      limit: 5,
      sellerUserId: input.visibleTo,
    }),
    deps.organizationSettings.findByOrganizationId(input.organizationId),
  ]);

  const enriched = await Promise.all(
    history.map(async (m) => {
      const detail = await deps.meetings.findMeetingDetailWithAnalyses({
        id: m.id,
        organizationId: input.organizationId,
      });
      return meetingBriefingHistoryEntry({
        meetingAt: toAppTimeZoneDatetimeLocal(m.meetingAt),
        meetingType: m.meetingType ?? null,
        pipelineStage: m.pipelineStage,
        visitReportDraft: detail?.visitReportDraft ?? null,
        analyses: detail?.analyses ?? [],
      });
    }),
  );

  const hasHistory = enriched.length > 0;
  const promptMarkdown = await loadAnalysisPromptMarkdown(
    deps.prompts,
    "MEETING_BRIEFING",
  );
  const systemMarkdown = composeAnalysisSystemMarkdown(promptMarkdown, [
    organizationPlaybookMarkdownForAnalysis(settings),
    referenceNamesInstruction({
      prospectName: person.displayName,
      prospectCompany: person.company,
    }),
  ]);
  const model = await resolvePromptGatewayModel(
    deps.prompts,
    "MEETING_BRIEFING",
  );
  const { result } = await deps.analysis.prepareMeetingBriefing({
    systemMarkdown,
    model,
    targetStage: input.targetStage,
    prospectCompany: person.company ?? person.displayName,
    prospectName: person.displayName,
    prospectJobTitle: person.jobTitle,
    priorMeetingsJson: JSON.stringify(enriched, null, 2),
    hasHistory,
  });

  return {
    person,
    briefing: {
      ...result,
      likelyObjections: withProvableAnswers(result.likelyObjections),
    },
    hasHistory,
    /* Les défis du rendez-vous le plus récent qui en porte : ils ont été écrits pour celui-ci. */
    challenges: enriched.find((e) => e.challenges.length > 0)?.challenges ?? [],
  };
}
