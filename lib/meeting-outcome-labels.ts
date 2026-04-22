import type { MeetingOutcome } from "@/lib/generated/prisma/enums";

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
