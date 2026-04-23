import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";

/** Libellés type entonnoir commercial (maquette). */
export function meetingEtapeLabel(outcome: MeetingOutcome): string {
  switch (outcome) {
    case "WON":
      return "Proposition";
    case "FOLLOW_UP":
      return "Découverte";
    case "LOST":
      return "Négociation";
    case "NO_SHOW":
      return "Absent";
    default:
      return "Qualification";
  }
}

export function meetingEtapePillClass(outcome: MeetingOutcome): string {
  switch (outcome) {
    case "WON":
      return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/50 dark:text-sky-200";
    case "FOLLOW_UP":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/50 dark:text-emerald-200";
    case "LOST":
      return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/50 dark:text-rose-200";
    case "NO_SHOW":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/50 dark:text-amber-200";
    default:
      return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/50 dark:text-violet-200";
  }
}
