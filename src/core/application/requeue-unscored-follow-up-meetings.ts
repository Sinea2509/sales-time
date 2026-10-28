import { scorecardGridForMeeting } from "@/src/core/domain/scorecard-grid-for-meeting";
import type { AnalysisJobRepositoryPort } from "@/src/core/ports/analysis-job-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

/**
 * La grille de suivi (démo, proposition, négociation) est en production depuis
 * le 28 octobre 2026 à 13 h 50 UTC. Une analyse mise en file avant cette heure
 * a trouvé ces rendez-vous sans grille, et ne les a donc pas notés.
 */
export const FOLLOW_UP_GRID_LIVE_SINCE = new Date("2026-10-28T14:00:00Z");

/** Combien de candidats lire à chaque passage, avant de garder ceux du suivi. */
const CANDIDATES_READ = 200;

/**
 * La file d'analyse prend les tâches par priorité décroissante : le rattrapage
 * passe après les rendez-vous que les commerciaux viennent de déposer.
 */
const CATCH_UP_PRIORITY = -1;

/**
 * Remet en file, une seule fois, les rendez-vous analysés sans score parce que
 * leur type n'avait pas encore de grille, et que la grille de suivi note
 * désormais. Les analyses dont l'entrée ne change pas reviennent du cache.
 *
 * Demande de Thomas du 28 octobre 2026 : noter la démo d'Alexandre, et les
 * autres rendez-vous dans son cas, sans bouton de relance.
 */
export async function requeueUnscoredFollowUpMeetings(
  deps: {
    analysisJobs: AnalysisJobRepositoryPort;
    meetings: MeetingRepositoryPort;
  },
  input: { limit: number },
): Promise<number> {
  const candidates =
    await deps.analysisJobs.listUnscoredMeetingsNotQueuedSince({
      notQueuedSince: FOLLOW_UP_GRID_LIVE_SINCE,
      limit: CANDIDATES_READ,
    });

  let requeued = 0;
  for (const meeting of candidates) {
    if (requeued >= input.limit) break;
    if (scorecardGridForMeeting(meeting)?.id !== "SUIVI") continue;
    /* Le compte rendu lit sa qualification dans la grille : il se réécrit. */
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
      priority: CATCH_UP_PRIORITY,
    });
    requeued += 1;
  }
  return requeued;
}
