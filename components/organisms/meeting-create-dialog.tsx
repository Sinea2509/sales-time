"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getOrgMeetingFormOptionsAction } from "@/app/[locale]/company/rendez-vous/actions";
import { BrandCtaButton } from "@/components/molecules/brand-cta-button";
import { MeetingCreateForm } from "@/components/organisms/meeting-create-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MeetingFormOptions = {
  meetingTypeOptions: string[];
  pipelineStageOptions: string[];
};

type MeetingCreateDialogProps = MeetingFormOptions & {
  defaultOpen?: boolean;
  className?: string;
  /** Preserved for in-app feedback tooling (e.g. dashboard CTA). */
  dataFeedbackId?: string;
  showPlusIcon?: boolean;
};

export function MeetingCreateDialog({
  meetingTypeOptions: initialMeetingTypeOptions,
  pipelineStageOptions: initialPipelineStageOptions,
  defaultOpen = false,
  className,
  dataFeedbackId,
  showPlusIcon = true,
}: MeetingCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [, startOptionsTransition] = useTransition();
  const [formOptions, setFormOptions] = useState<MeetingFormOptions>({
    meetingTypeOptions: initialMeetingTypeOptions,
    pipelineStageOptions: initialPipelineStageOptions,
  });

  function closeDialog() {
    setOpen(false);
  }

  function openDialog() {
    setOpen(true);
    startOptionsTransition(async () => {
      const res = await getOrgMeetingFormOptionsAction();
      if (res.ok) {
        setFormOptions({
          meetingTypeOptions: res.meetingTypeOptions,
          pipelineStageOptions: res.pipelineStageOptions,
        });
      }
    });
  }

  return (
    <>
      <BrandCtaButton
        onClick={openDialog}
        variant="primary"
        className={cn("gap-1", className)}
        data-feedback-id={dataFeedbackId}
      >
        {showPlusIcon ? <span className="text-lg leading-none">+</span> : null}
        Analyser un rendez-vous
      </BrandCtaButton>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeDialog();
          else openDialog();
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,48rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b px-4 py-4">
            <DialogTitle>Analyser un rendez-vous</DialogTitle>
            <DialogDescription>
              Renseignez les informations du RDV et le transcript pour lancer
              l&apos;analyse SONCAS / DISC / KISS.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <MeetingCreateForm
              key={formOptions.meetingTypeOptions.join("|")}
              variant="dialog"
              meetingTypeOptions={formOptions.meetingTypeOptions}
              onCancel={closeDialog}
              onSuccess={(meetingId) => {
                closeDialog();
                router.push(`/company/rendez-vous/${meetingId}`);
                router.refresh();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
