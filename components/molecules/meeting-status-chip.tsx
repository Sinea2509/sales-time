import { ToneChip, type ChipTone } from "@/components/atoms/tone-chip";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";

const STATUS: Readonly<
  Record<MeetingStatus, { label: string; tone: ChipTone }>
> = {
  PENDING: { label: "À analyser", tone: "warn" },
  PROCESSING: { label: "Analyse en cours", tone: "info" },
  READY: { label: "Analysé", tone: "ok" },
  FAILED: { label: "Analyse échouée", tone: "bad" },
};

export function MeetingStatusChip({
  status,
  className,
}: {
  status: MeetingStatus;
  className?: string;
}) {
  const s = STATUS[status];
  return (
    <ToneChip tone={s.tone} className={className}>
      {s.label}
    </ToneChip>
  );
}
