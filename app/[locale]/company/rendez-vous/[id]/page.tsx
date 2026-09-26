import { notFound, redirect } from "next/navigation";
import { MeetingDetailShell } from "@/components/organisms/meeting-detail-shell";
import { getApplicationDeps } from "@/lib/application-deps";
import { isAudioFilename } from "@/lib/audio-transcript";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { checkAiGatewayConfigured } from "@/lib/env";
import { meetingIdSchema } from "@/lib/schemas/meeting";
import { summarizeMeetingDetail } from "@/src/core/application/summarize-meeting-detail";
import {
  discResultSchema,
  soncasResultSchema,
} from "@/src/core/domain/analysis-result-zod";
import {
  analysisReliabilityFromWords,
  countWords,
} from "@/src/core/domain/analysis-reliability";
import { salesScoreFromSoncasResult } from "@/src/core/domain/dashboard-sales-score";
import { kissResultSchema } from "@/src/core/domain/kiss-result-zod";
import { meetingAnalysisProgress } from "@/src/core/domain/meeting-analysis-progress";
import {
  isMeetingAnalysisSlow,
  isMeetingAnalysisStuck,
} from "@/src/core/domain/meeting-analysis-stuck";
import { salesScoreAverage } from "@/src/core/domain/note-globale-on5";
import { scorecardCriteria } from "@/src/core/domain/scorecard-grid";
import { scorecardGridForMeeting } from "@/src/core/domain/scorecard-grid-for-meeting";
import { scorecardResultSchema } from "@/src/core/domain/scorecard-result-zod";
import { talkShareFromTranscript } from "@/src/core/domain/talk-share-from-transcript";
import { memberDisplayName } from "@/src/core/domain/weekly-manager-digest";

export const dynamic = "force-dynamic";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const PLAN_ACTIONS_MAX = 4;

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

  const isSeller =
    actor.internalUserId != null &&
    meeting.sellerUserId === actor.internalUserId;
  const canEdit = isSeller || actor.canManageOrganization;
  const canViewSellerCoaching = isSeller || actor.canManageOrganization;

  const since = new Date(new Date().getTime() - THIRTY_DAYS_MS);
  const [contact, sellerMembership, sellerMeetings30d, teamMeetings30d] =
    await Promise.all([
      deps.contacts.findById({ id: meeting.personId, organizationId }),
      actor.canManageOrganization && !isSeller
        ? deps.organizationTeam.findMembershipForManagerView(
            organizationId,
            meeting.sellerUserId,
          )
        : Promise.resolve(null),
      deps.meetings.listRecentMeetingsForDashboard({
        organizationId,
        sellerUserId: meeting.sellerUserId,
        meetingAtSince: since,
        limit: 200,
      }),
      deps.meetings.listRecentMeetingsForDashboard({
        organizationId,
        meetingAtSince: since,
        limit: 1000,
      }),
    ]);

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
    disparaît, le reste de la fiche s'affiche.
  */
  const scorecardParsed = scorecard
    ? scorecardResultSchema.safeParse(scorecard.result)
    : null;

  const salesScore = soncas ? salesScoreFromSoncasResult(soncas.result) : null;
  const scoresOf = (rows: typeof sellerMeetings30d) =>
    rows
      .filter((m) => m.id !== meeting.id)
      .map((m) => m.salesScore)
      .filter((s): s is number => typeof s === "number");

  const grid = scorecardGridForMeeting({
    meetingType: meeting.meetingType,
    pipelineStage: meeting.pipelineStage,
  });
  const gridAssumed =
    grid != null &&
    !meeting.meetingType?.trim() &&
    !meeting.pipelineStage?.trim();

  const analysisProgress = meetingAnalysisProgress({
    status: meeting.status,
    updatedAt: meeting.updatedAt,
    analyses: meeting.analyses,
    scorecardApplicable: grid != null,
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

  const transcriptWords = countWords(meeting.transcript);
  const transcribedFromAudio =
    meeting.sourceType === "UPLOAD" &&
    isAudioFilename(meeting.sourceBlobUrl ?? "");

  const kissData = kissParsed?.success ? kissParsed.data : null;
  const planActions = kissData
    ? [...kissData.start, ...kissData.improve]
        .map((s) => s.replace(/^[\s\-\u2013\u2014\u2022\u00b7]+\s*/, "").trim())
        .filter(Boolean)
        .slice(0, PLAN_ACTIONS_MAX)
    : [];

  return (
    <MeetingDetailShell
      meeting={{
        id: meeting.id,
        prospectName: meeting.prospectName,
        status: meeting.status,
        transcript: meeting.transcript,
        notes: meeting.notes,
        followUpEmailDraft: meeting.followUpEmailDraft,
        errorMessage: meeting.errorMessage,
        meetingType: meeting.meetingType,
        pipelineStage: meeting.pipelineStage,
      }}
      header={{
        prospectName: meeting.prospectName,
        prospectCompany: meeting.prospectCompany,
        prospectJobTitle: contact?.jobTitle ?? null,
        meetingAt: meeting.meetingAt,
        durationMin: meeting.durationMin,
        meetingType: meeting.meetingType,
        pipelineStage: meeting.pipelineStage,
        potentialAmount: meeting.potentialAmount,
        sellerName: sellerMembership
          ? memberDisplayName({
              firstName: sellerMembership.user.firstName,
              lastName: sellerMembership.user.lastName,
              email: sellerMembership.user.email,
            })
          : null,
        backHref: "/company/rendez-vous",
      }}
      rail={{
        salesScore,
        scorePending: meeting.status === "PROCESSING" && salesScore == null,
        gridName: grid?.name ?? null,
        sellerAverage30d: salesScoreAverage(scoresOf(sellerMeetings30d)),
        teamAverage30d: salesScoreAverage(scoresOf(teamMeetings30d)),
        talkShare: talkShareFromTranscript(meeting.transcript),
        planActions,
        provenance: {
          gridName: grid?.name ?? null,
          criteriaCount: grid ? scorecardCriteria(grid).length : null,
          reliability: analysisReliabilityFromWords(transcriptWords),
          transcriptWords,
          transcribedFromAudio,
          durationMin: meeting.durationMin,
          computedAt: soncas?.createdAt ?? null,
        },
      }}
      analysisProgress={analysisProgress}
      meetingSynthesis={synthesis.meetingSynthesis}
      synthesisFromAi={synthesis.fromAi}
      streamVisitReport={streamVisitReport}
      soncasResult={soncasParsed?.success ? soncasParsed.data : null}
      discResult={discParsed?.success ? discParsed.data : null}
      kissResult={kissData}
      scorecardResult={scorecardParsed?.success ? scorecardParsed.data : null}
      scorecardGridIntent={grid?.intent ?? null}
      scorecardGridAssumed={gridAssumed}
      transcriptSourceLabel={
        transcribedFromAudio
          ? "Transcrit automatiquement depuis un enregistrement audio, un intervenant par ligne."
          : meeting.sourceType === "UPLOAD"
            ? "Lu depuis le fichier importé."
            : null
      }
      showSellerCoaching={canViewSellerCoaching}
      canEdit={canEdit}
      processingLooksSlow={isMeetingAnalysisSlow({
        status: meeting.status,
        updatedAt: meeting.updatedAt,
      })}
      processingLooksStuck={isMeetingAnalysisStuck({
        status: meeting.status,
        updatedAt: meeting.updatedAt,
      })}
    />
  );
}
