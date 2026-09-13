"use server";

import { revalidatePath } from "next/cache";
import { requireAnalysisActor } from "@/lib/analysis-server-context";
import { loadCommercialKissAppendix } from "@/lib/kiss-commercial-appendix";
import { loadOrganizationPlaybookMarkdown } from "@/lib/load-organization-playbook";
import { requireMeetingMutationAccess } from "@/lib/meeting-mutation-access";
import { meetingIdSchema } from "@/lib/schemas/meeting";
import {
  runMeetingAnalysis,
  type AnalysisKindToRun,
} from "@/src/core/application/run-meeting-analysis";

function revalidateMeetingAnalysisPaths(meetingId: string) {
  revalidatePath("/company/analyse");
  revalidatePath(`/company/rendez-vous/${meetingId}`);
  revalidatePath("/company");
}

export async function runMeetingAnalysisAction(
  meetingId: string,
  kind: AnalysisKindToRun,
) {
  const parsedId = meetingIdSchema.safeParse(meetingId);
  if (!parsedId.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const actor = await requireAnalysisActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const access = await requireMeetingMutationAccess(
    actor.deps.meetings,
    actor,
    parsedId.data,
  );
  if (!access.ok) {
    return { ok: false as const, error: access.error };
  }

  const kissSystemMarkdownAppendix =
    kind === "KISS"
      ? await loadCommercialKissAppendix(actor.deps)
      : undefined;
  const organizationPlaybookMarkdown = await loadOrganizationPlaybookMarkdown(
    actor.deps,
    actor.organizationId,
  );

  const result = await runMeetingAnalysis(actor.deps, {
    organizationId: actor.organizationId,
    meetingId: parsedId.data,
    kind,
    kissSystemMarkdownAppendix,
    organizationPlaybookMarkdown,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error, message: result.message };
  }

  revalidateMeetingAnalysisPaths(parsedId.data);
  return { ok: true as const, analysisId: result.analysisId };
}
