import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";

/** Ce que le téléphone affiche d'un rendez-vous : jamais le transcript ni les analyses. */
export type MobileMeeting = {
  id: string;
  prospectName: string;
  prospectCompany: string | null;
  meetingAt: string;
  durationMin: number | null;
  outcome: MeetingOutcome;
  status: MeetingStatus;
  /** Le chemin de la fiche sur le site, à ouvrir dans le navigateur. */
  webPath: string;
};

export function toMobileMeeting(row: {
  id: string;
  prospectName: string;
  prospectCompany: string | null;
  meetingAt: Date;
  durationMin: number | null;
  outcome: MeetingOutcome;
  status: MeetingStatus;
}): MobileMeeting {
  return {
    id: row.id,
    prospectName: row.prospectName,
    prospectCompany: row.prospectCompany,
    meetingAt: row.meetingAt.toISOString(),
    durationMin: row.durationMin,
    outcome: row.outcome,
    status: row.status,
    webPath: `/company/rendez-vous/${row.id}`,
  };
}
