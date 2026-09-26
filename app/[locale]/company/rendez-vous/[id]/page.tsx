import { notFound, redirect } from "next/navigation";
import { MeetingDetailShell } from "@/components/organisms/meeting-detail-shell";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { meetingIdSchema } from "@/lib/schemas/meeting";
import {
  discResultSchema,
  soncasResultSchema,
} from "@/src/core/domain/analysis-result-zod";
import { kissResultSchema } from "@/src/core/domain/kiss-result-zod";
import { scorecardResultSchema } from "@/src/core/domain/scorecard-result-zod";
import { salesScoreFromSoncasResult } from "@/src/core/domain/dashboard-sales-score";
import { tamMinutesSavedPerMeetingFromSettings } from "@/src/core/domain/dashboard-estimates";
import { meetingAnalysisProgress } from "@/src/core/domain/meeting-analysis-progress";
import { scorecardGridForMeeting } from "@/src/core/domain/scorecard-grid-for-meeting";
import { summarizeMeetingDetail } from "@/src/core/application/summarize-meeting-detail";
import { getApplicationDeps } from "@/lib/application-deps";
import { checkAiGatewayConfigured } from "@/lib/env";
import {
  isMeetingAnalysisSlow,
  isMeetingAnalysisStuck,
} from "@/src/core/domain/meeting-analysis-stuck";

export const dynamic = "force-dynamic";

async function previousSalesScoreForMeeting(
  deps: ReturnType<typeof getApplicationDeps>,
  input: {
    organizationId: string;
    personId: string;
    meetingId: string;
    meetingAt: Date;
  },
): Promise<number | null> {
  const personMeetings = await deps.meetings.listMeetingsForPersonInOrg({
    organizationId: input.organizationId,
    personId: input.personId,
  });
  const previousMeeting = personMeetings
    .filter(
      (m) =>
        m.id !== input.meetingId &&
        m.meetingAt.getTime() < input.meetingAt.getTime(),
    )
    .sort((a, b) => b.meetingAt.getTime() - a.meetingAt.getTime())[0];
  if (!previousMeeting) return null;

  const previousSoncas = await deps.meetings.findLatestAnalysisForMeeting({
    meetingId: previousMeeting.id,
    organizationId: input.organizationId,
    kind: "SONCAS",
  });
  return previousSoncas
    ? salesScoreFromSoncasResult(previousSoncas.result)
    : null;
}

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
  let settings;
  try {
    [meeting, settings] = await Promise.all([
      deps.meetings.findMeetingDetailWithAnalyses({
        id,
        organizationId,
      }),
      deps.organizationSettings.findByOrganizationId(organizationId),
    ]);
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
  const scorecard = meeting.analyses.find((a) => a.kind === "SCORECARD");
  const soncasParsed = soncas
    ? soncasResultSchema.safeParse(soncas.result)
    : null;
  const discParsed = disc ? discResultSchema.safeParse(disc.result) : null;
  const kissParsed = kiss ? kissResultSchema.safeParse(kiss.result) : null;
  /*
    Une ligne illisible se comporte comme une ligne absente : la section
    disparaît, le reste de la fiche s'affiche. Le rendez-vous garde ses trois
    autres analyses, et le commercial n'a pas une page en erreur pour une
    scorecard écrite par une version du schéma qui n'est plus la nôtre.
  */
  const scorecardParsed = scorecard
    ? scorecardResultSchema.safeParse(scorecard.result)
    : null;

  const salesScore = soncas ? salesScoreFromSoncasResult(soncas.result) : null;
  const previousSalesScore = await previousSalesScoreForMeeting(deps, {
    organizationId,
    personId: meeting.personId,
    meetingId: meeting.id,
    meetingAt: meeting.meetingAt,
  });
  const salesScoreDelta =
    salesScore != null && previousSalesScore != null
      ? salesScore - previousSalesScore
      : null;
  const tamMinutesPerRdv = tamMinutesSavedPerMeetingFromSettings(settings);

  const isSeller =
    actor.internalUserId != null &&
    meeting.sellerUserId === actor.internalUserId;
  const canEdit = isSeller || actor.canManageOrganization;

  const processingLooksSlow = isMeetingAnalysisSlow({
    status: meeting.status,
    updatedAt: meeting.updatedAt,
  });
  const processingLooksStuck = isMeetingAnalysisStuck({
    status: meeting.status,
    updatedAt: meeting.updatedAt,
  });

  const analysisProgress = meetingAnalysisProgress({
    status: meeting.status,
    updatedAt: meeting.updatedAt,
    analyses: meeting.analyses,
    scorecardApplicable:
      scorecardGridForMeeting({
        meetingType: meeting.meetingType,
        pipelineStage: meeting.pipelineStage,
      }) != null,
  });

  /*
    Le compte rendu ne s'écrit plus pendant le rendu de la page : la fiche
    s'ouvre tout de suite, et le texte se compose sous les yeux du lecteur.
  */
  const synthesis = await summarizeMeetingDetail(
    { ...deps, meetings: deps.meetings },
    {
      meeting,
      discResult: discParsed?.success ? discParsed.data : null,
      soncasResult: soncasParsed?.success ? soncasParsed.data : null,
      kissResult: kissParsed?.success ? kissParsed.data : null,
      organizationId,
      generateIfMissing: false,
    },
  );
  const streamVisitReport =
    !synthesis.fromAi &&
    meeting.status === "READY" &&
    meeting.transcript.trim().length > 0 &&
    checkAiGatewayConfigured().ok;

  const canViewSellerCoaching = isSeller || actor.canManageOrganization;

  return (
    <MeetingDetailShell
      meeting={{
        id: meeting.id,
        prospectName: meeting.prospectName,
        prospectCompany: meeting.prospectCompany,
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
      tamMinutesPerRdv={tamMinutesPerRdv}
      salesScore={salesScore}
      salesScoreDelta={salesScoreDelta}
      analysisProgress={analysisProgress}
      meetingSynthesis={synthesis.meetingSynthesis}
      synthesisFromAi={synthesis.fromAi}
      streamVisitReport={streamVisitReport}
      interlocutorProfile={synthesis.interlocutorProfile}
      soncasResult={soncasParsed?.success ? soncasParsed.data : null}
      discResult={discParsed?.success ? discParsed.data : null}
      kissResult={kissParsed?.success ? kissParsed.data : null}
      scorecardResult={scorecardParsed?.success ? scorecardParsed.data : null}
      showSellerCoaching={canViewSellerCoaching}
      canEdit={canEdit}
      processingLooksSlow={processingLooksSlow}
      processingLooksStuck={processingLooksStuck}
    />
  );
}
