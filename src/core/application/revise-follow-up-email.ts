import { FOLLOW_UP_EMAIL_REVISION_SYSTEM_PROMPT } from "@/lib/ai-system-prompt";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import {
  followUpEmailRevisionSchema,
  type FollowUpEmailRevision,
} from "@/src/core/domain/follow-up-email-zod";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { MeetingDetailWithAnalyses } from "@/src/core/ports/meeting-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import { meetingContextBlock } from "./generate-follow-up-email";

/** Le transcript relu pour une retouche : assez pour retrouver un fait demandé. */
const TRANSCRIPT_MAX_CHARS = 40_000;

/**
 * Retouche le mail proposé selon la demande du commercial : « plus court »,
 * « plus formel », « ajoute que la DRH sera présente »…
 *
 * Demande de Thomas du 28 octobre 2026 : sans cela, chacun copiait le mail dans
 * ChatGPT pour le modifier. Le modèle reçoit le transcript pour retrouver un
 * fait demandé, et sa consigne lui interdit d'en inventer un : ce qui manque se
 * marque entre crochets.
 */
export async function reviseFollowUpEmail(
  deps: {
    analysis: AnalysisPort;
    prompts: PromptTemplateRepositoryPort;
  },
  input: {
    meeting: Pick<
      MeetingDetailWithAnalyses,
      | "meetingAt"
      | "prospectName"
      | "prospectCompany"
      | "meetingType"
      | "transcript"
    >;
    subject: string;
    body: string;
    instruction: string;
  },
): Promise<FollowUpEmailRevision> {
  const model = await resolvePromptGatewayModel(
    deps.prompts,
    "FOLLOW_UP_EMAIL",
  );
  const userContent = [
    meetingContextBlock(input.meeting),
    `<transcript>\n${input.meeting.transcript.slice(0, TRANSCRIPT_MAX_CHARS)}\n</transcript>`,
    `<mail_actuel>\nObjet : ${input.subject.trim()}\n\n${input.body.trim()}\n</mail_actuel>`,
    `<demande>\n${input.instruction.trim()}\n</demande>`,
  ].join("\n\n");
  const revised = await deps.analysis.reviseFollowUpEmail({
    systemPrompt: FOLLOW_UP_EMAIL_REVISION_SYSTEM_PROMPT,
    model,
    userContent,
  });
  return followUpEmailRevisionSchema.parse(revised);
}
