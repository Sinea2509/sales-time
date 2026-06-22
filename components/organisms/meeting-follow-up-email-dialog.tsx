"use client";

import { useState } from "react";
import { BrandCtaButton } from "@/components/molecules/brand-cta-button";
import { MeetingFollowUpEmailBlock } from "@/components/organisms/meeting-follow-up-email";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function MeetingFollowUpEmailDialog({
  meetingId,
  prospectName,
  initialDraft,
}: {
  meetingId: string;
  prospectName: string;
  initialDraft: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <BrandCtaButton
        variant="primary"
        size="md"
        className="h-11 shrink-0 rounded-full px-6 text-sm font-medium"
        onClick={() => setOpen(true)}
      >
        Rédiger un email
      </BrandCtaButton>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(90vh,52rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mail de suivi — {prospectName}</DialogTitle>
            <DialogDescription>
              Généré à partir du transcript et des analyses — à relire avant
              envoi.
            </DialogDescription>
          </DialogHeader>
          <MeetingFollowUpEmailBlock
            meetingId={meetingId}
            initialDraft={initialDraft}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
