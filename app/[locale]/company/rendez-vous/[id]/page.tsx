import { notFound, redirect } from "next/navigation";
import { MeetingDetailShell } from "@/components/organisms/meeting-detail-shell";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { meetingIdSchema } from "@/lib/schemas/meeting";
import {
  discResultSchema,
  soncasResultSchema,
} from "@/src/core/domain/analysis-result-zod";
import { kissResultSchema } from "@/src/core/domain/kiss-result-zod";
import { getApplicationDeps } from "@/lib/application-deps";
import { isMeetingAnalysisStuck } from "@/src/core/domain/meeting-analysis-stuck";

export const dynamic = "force-dynamic";

export default async function RendezVousDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!meetingIdSchema.safeParse(id).success) {
    notFound();
  }

  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const organizationId = actor.activeOrganizationId;
  const deps = getApplicationDeps();

  let meeting;
  try {
    meeting = await deps.meetings.findMeetingDetailWithAnalyses({
      id,
      organizationId,
    });
  } catch (cause) {
    console.error("rendez-vous detail load failed", {
      meetingId: id,
      organizationId,
      cause,
    });
    throw cause;
  }

  if (!meeting) notFound();

  const soncas = meeting.analyses.find((a) => a.kind === "SONCAS");
  const disc = meeting.analyses.find((a) => a.kind === "DISC");
  const kiss = meeting.analyses.find((a) => a.kind === "KISS");
  const soncasParsed = soncas
    ? soncasResultSchema.safeParse(soncas.result)
    : null;
  const discParsed = disc ? discResultSchema.safeParse(disc.result) : null;
  const kissParsed = kiss ? kissResultSchema.safeParse(kiss.result) : null;

  const isSeller =
    actor.internalUserId != null &&
    meeting.sellerUserId === actor.internalUserId;
  const canEdit = isSeller || actor.canManageOrganization;

  const processingLooksStuck = isMeetingAnalysisStuck({
    status: meeting.status,
    analysisCount: meeting.analyses.length,
    updatedAt: meeting.updatedAt,
  });

  return (
    <MeetingDetailShell
      meeting={{
        id: meeting.id,
        prospectName: meeting.prospectName,
        status: meeting.status,
        feeling: meeting.feeling,
        meetingAt: meeting.meetingAt,
        outcome: meeting.outcome,
        meetingType: meeting.meetingType,
        pipelineStage: meeting.pipelineStage,
        potentialAmount: meeting.potentialAmount,
        transcript: meeting.transcript,
        notes: meeting.notes,
        followUpEmailDraft: meeting.followUpEmailDraft,
        errorMessage: meeting.errorMessage,
      }}
      analyses={meeting.analyses.map((a) => ({
        kind: a.kind,
        model: a.model,
      }))}
      soncasResult={soncasParsed?.success ? soncasParsed.data : null}
      discResult={discParsed?.success ? discParsed.data : null}
      kissResult={kissParsed?.success ? kissParsed.data : null}
      showKissCoaching={isSeller}
      canEdit={canEdit}
      processingLooksStuck={processingLooksStuck}
    />
  );
}
