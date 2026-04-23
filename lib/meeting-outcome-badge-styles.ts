import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";

/** Pastilles type maquette (neutre / succès / alerte). */
export function meetingOutcomeBadgeClass(outcome: MeetingOutcome): string {
  switch (outcome) {
    case "WON":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200";
    case "LOST":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200";
    case "FOLLOW_UP":
      return "border-[#6C4DFF]/25 bg-[#6C4DFF]/10 text-[#4c36b3] dark:border-[#6C4DFF]/30 dark:bg-[#6C4DFF]/15 dark:text-[#c4b5fd]";
    case "NO_SHOW":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}
