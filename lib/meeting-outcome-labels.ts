import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";

const labels: Record<MeetingOutcome, string> = {
  WON: "Gagné",
  LOST: "Perdu",
  FOLLOW_UP: "Suivi",
  NO_SHOW: "Absent",
  OTHER: "Autre",
};

export function meetingOutcomeLabel(outcome: MeetingOutcome): string {
  return labels[outcome] ?? outcome;
}
