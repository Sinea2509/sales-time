import {
  isMeetingStatus,
  type MeetingStatus,
} from "@/src/core/domain/meeting-status";

const LABELS: Record<MeetingStatus, string> = {
  PENDING: "En attente",
  PROCESSING: "Analyse en cours",
  READY: "Prêt",
  FAILED: "Échec",
};

const CLASSES: Record<MeetingStatus, string> = {
  PENDING: "bg-muted text-foreground",
  PROCESSING: "bg-amber-100 text-amber-800",
  READY: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
};

export function meetingStatusLabel(status: MeetingStatus | string): string {
  if (isMeetingStatus(status)) return LABELS[status];
  return String(status);
}

export function meetingStatusBadgeClass(
  status: MeetingStatus | string,
): string {
  if (isMeetingStatus(status)) return CLASSES[status];
  return "bg-muted text-foreground";
}
