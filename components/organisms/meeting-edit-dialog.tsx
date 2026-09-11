"use client";

import { useRouter } from "next/navigation";
import { MeetingCreateForm } from "@/components/organisms/meeting-create-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MeetingEditPayload } from "@/app/[locale]/company/rendez-vous/actions";

type MeetingFormOptions = {
  meetingTypeOptions: string[];
  pipelineStageOptions: string[];
};

export function MeetingEditDialog({
  prospectName,
  open,
  loading,
  loadError,
  meeting,
  formOptions,
  onOpenChange,
  onSuccess,
}: {
  prospectName: string;
  open: boolean;
  loading: boolean;
  loadError: string | null;
  meeting: MeetingEditPayload | null;
  formOptions: MeetingFormOptions;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();

  function handleSuccess() {
    onOpenChange(false);
    if (onSuccess) {
      onSuccess();
    } else {
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,48rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-4 py-4">
          <DialogTitle>Modifier le rendez-vous</DialogTitle>
          <DialogDescription>
            Corrigez les informations saisies lors de l&apos;analyse initiale
            {prospectName ? ` du rendez-vous avec ${prospectName}` : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Chargement…</p>
          ) : loadError ? (
            <p className="text-destructive text-sm" role="alert">
              {loadError}
            </p>
          ) : meeting ? (
            <MeetingCreateForm
              key={meeting.meetingId}
              variant="dialog"
              mode="edit"
              initialValues={{
                meetingId: meeting.meetingId,
                personId: meeting.personId,
                prospectName: meeting.prospectName,
                meetingAtIso: meeting.meetingAtIso,
                durationMin: meeting.durationMin,
                meetingType: meeting.meetingType,
                pipelineStage: meeting.pipelineStage,
                potentialAmount: meeting.potentialAmount,
                outcome: meeting.outcome,
                feeling: meeting.feeling ?? 3,
                transcript: meeting.transcript,
                notes: meeting.notes,
              }}
              meetingTypeOptions={formOptions.meetingTypeOptions}
              onCancel={() => onOpenChange(false)}
              onSuccess={handleSuccess}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
