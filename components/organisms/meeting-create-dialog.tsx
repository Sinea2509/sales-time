"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

type MeetingCreateDialogProps = {
  meetingTypeOptions: string[];
  pipelineStageOptions: string[];
  defaultOpen?: boolean;
  className?: string;
};

export function MeetingCreateDialog({
  meetingTypeOptions,
  pipelineStageOptions,
  defaultOpen = false,
  className,
}: MeetingCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);

  function closeDialog() {
    setOpen(false);
  }

  return (
    <>
      <BrandCtaButton
        onClick={() => setOpen(true)}
        className={cn("gap-1", className)}
      >
        <span className="text-lg leading-none">+</span>
        Analyser un RDV
      </BrandCtaButton>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeDialog();
          else setOpen(true);
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
              variant="dialog"
              meetingTypeOptions={meetingTypeOptions}
              pipelineStageOptions={pipelineStageOptions}
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
