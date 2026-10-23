import { talkShareFromTranscript } from "@/src/core/domain/talk-share-from-transcript";
import type { AnalysisJobRepositoryPort } from "@/src/core/ports/analysis-job-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

/**
 * La date de la correction du lecteur de transcript : les exports Teams dont
 * la réplique suit l'horodatage sur la même ligne se lisent depuis le
 * 23 octobre 2026. Seules les analyses antérieures sont reprises : une analyse
 * plus récente a déjà profité de la correction, ce qui exclut toute boucle.
 */
export const SPEAKERS_READER_FIXED_AT = new Date("2026-10-24T00:00:00Z");

/**
 * Remet en file, une seule fois, les rendez-vous dont l'analyse n'avait pas
 * distingué les intervenants mais dont le transcript se lit désormais. Leur
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
  input: { limit: number; analyzedBefore?: Date },
): Promise<number> {
  const candidates = await deps.analysisJobs.listMeetingsWithUnreadSpeakers({
    analyzedBefore: input.analyzedBefore ?? SPEAKERS_READER_FIXED_AT,
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
