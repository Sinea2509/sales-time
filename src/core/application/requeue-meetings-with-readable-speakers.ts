import { talkShareFromTranscript } from "@/src/core/domain/talk-share-from-transcript";
import type { AnalysisJobRepositoryPort } from "@/src/core/ports/analysis-job-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

/**
 * Remet en file les rendez-vous dont la dernière analyse n'avait pas distingué
 * les intervenants mais dont le transcript se lit désormais. La nouvelle
 * analyse les distingue : le rendez-vous ne revient donc pas une seconde fois. Leur
 * écoute et leur questionnement sont alors mesurés, sans que personne n'ait à
 * relancer quoi que ce soit.
 *
 * Demande de Thomas du 23 octobre 2026 : relancer automatiquement les
 * analyses de François, sans bouton de relance.
 */
export async function requeueMeetingsWithReadableSpeakers(
  deps: {
    analysisJobs: AnalysisJobRepositoryPort;
    meetings: MeetingRepositoryPort;
  },
  input: { limit: number },
): Promise<number> {
  const candidates = await deps.analysisJobs.listMeetingsWithUnreadSpeakers({
    limit: input.limit,
  });

  let requeued = 0;
  for (const meeting of candidates) {
    if (!talkShareFromTranscript(meeting.transcript)?.rolesRecognized) continue;
    /* Le compte rendu reprend les notes : il se réécrit avec les nouvelles. */
    await deps.meetings.updateMeetingVisitReportDraft({
      id: meeting.id,
      organizationId: meeting.organizationId,
      visitReportDraft: null,
    });
    await deps.meetings.updateMeetingStatus({
      id: meeting.id,
      organizationId: meeting.organizationId,
      status: "PROCESSING",
      errorMessage: null,
    });
    await deps.analysisJobs.enqueueMeetingAnalysis({
      organizationId: meeting.organizationId,
      meetingId: meeting.id,
    });
    requeued += 1;
  }
  return requeued;
}
