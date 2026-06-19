"use server";

import { revalidatePath } from "next/cache";
import { requireAnalysisActor } from "@/lib/analysis-server-context";
import { loadCommercialKissAppendix } from "@/lib/kiss-commercial-appendix";
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

  const kissSystemMarkdownAppendix =
    kind === "KISS"
      ? await loadCommercialKissAppendix(actor.deps)
      : undefined;

  const result = await runMeetingAnalysis(actor.deps, {
    organizationId: actor.organizationId,
    meetingId: parsedId.data,
    kind,
    kissSystemMarkdownAppendix,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error, message: result.message };
  }

  revalidateMeetingAnalysisPaths(parsedId.data);
  return { ok: true as const, analysisId: result.analysisId };
}

export async function runSoncasAnalysisAction(meetingId: string) {
  return runMeetingAnalysisAction(meetingId, "SONCAS");
}

export async function runDiscAnalysisAction(meetingId: string) {
  return runMeetingAnalysisAction(meetingId, "DISC");
}

export async function runKissAnalysisAction(meetingId: string) {
  return runMeetingAnalysisAction(meetingId, "KISS");
}
