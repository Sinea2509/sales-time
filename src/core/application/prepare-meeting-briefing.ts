import {
  loadAnalysisPromptMarkdown,
} from "@/lib/load-analysis-prompt";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import { kissResultSchema } from "@/src/core/domain/kiss-result-zod";
import { discResultSchema, soncasResultSchema } from "@/src/core/domain/analysis-result-zod";

export async function prepareMeetingBriefing(
  deps: {
    meetings: MeetingRepositoryPort;
    contacts: ContactRepositoryPort;
    analysis: AnalysisPort;
    prompts: PromptTemplateRepositoryPort;
  },
  input: {
    organizationId: string;
    personId: string;
    targetStage: string;
    model: string;
  },
) {
  const person = await deps.contacts.findById({
    id: input.personId,
    organizationId: input.organizationId,
  });
  if (!person) return null;

  const history = await deps.meetings.listMeetingsForPersonOrdered({
    organizationId: input.organizationId,
    personId: input.personId,
    limit: 5,
  });

  const enriched = await Promise.all(
    history.map(async (m) => {
      const detail = await deps.meetings.findMeetingDetailWithAnalyses({
        id: m.id,
        organizationId: input.organizationId,
      });
      const kiss = detail?.analyses.find((a) => a.kind === "KISS");
      const disc = detail?.analyses.find((a) => a.kind === "DISC");
      const soncas = detail?.analyses.find((a) => a.kind === "SONCAS");
      const kissParsed = kiss ? kissResultSchema.safeParse(kiss.result) : null;
      return {
        meetingAt: m.meetingAt.toISOString(),
        stage: m.pipelineStage,
        summary: kissParsed?.success ? kissParsed.data.summary : null,
        disc: disc ? discResultSchema.safeParse(disc.result).data ?? null : null,
        soncas: soncas
          ? soncasResultSchema.safeParse(soncas.result).data ?? null
          : null,
        customQuestions: kissParsed?.success
          ? kissParsed.data.start.slice(0, 4)
          : [],
        openPoints: kissParsed?.success
          ? kissParsed.data.improve.slice(0, 4)
          : [],
      };
    }),
  );

  const hasHistory = enriched.length > 0;
  const systemMarkdown = await loadAnalysisPromptMarkdown(
    deps.prompts,
    "MEETING_BRIEFING",
  );
  const { result } = await deps.analysis.prepareMeetingBriefing({
    systemMarkdown,
    model: input.model,
    targetStage: input.targetStage,
    prospectCompany: person.company ?? person.displayName,
    priorMeetingsJson: JSON.stringify(enriched, null, 2),
    hasHistory,
  });

  return {
    person,
    briefing: result,
    hasHistory,
  };
}
