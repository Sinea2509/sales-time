"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reanalyzeMeetingAction } from "@/app/[locale]/company/rendez-vous/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ERRORS: Record<string, string> = {
  FORBIDDEN: "Vous ne pouvez pas relancer l'analyse de ce rendez-vous.",
  ALREADY_RUNNING: "L'analyse de ce rendez-vous est déjà en cours.",
  QUOTA_EXHAUSTED:
    "Vous n'avez plus d'analyse d'essai disponible pour relancer celle-ci.",
};

/**
 * Relance l'analyse d'un rendez-vous déjà analysé, après confirmation : les
 * notes, le coaching et le compte rendu sont recalculés.
 */
export function MeetingReanalyzeButton({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await reanalyzeMeetingAction(meetingId);
      if (!result.ok) {
        setError(
          ERRORS[result.error] ??
            "Impossible de relancer l'analyse. Réessayez dans un instant.",
        );
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <RefreshCw className="size-4" aria-hidden />
        Relancer l&apos;analyse
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relancer l&apos;analyse ?</DialogTitle>
            <DialogDescription>
              Le SalesScore, les défis, le coaching et le compte rendu seront
              recalculés avec les règles actuelles. Les notes peuvent changer.
              Comptez quelques minutes.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={pending}
              className="bg-brand text-brand-foreground hover:bg-brand-hover"
              onClick={confirm}
            >
              {pending ? "Relance…" : "Relancer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
