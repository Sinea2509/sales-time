"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { retryMeetingAnalysisAction } from "@/app/[locale]/company/rendez-vous/[id]/actions";
import { Button } from "@/components/ui/button";

export function MeetingAnalysisRetryButton({
  meetingId,
}: {
  meetingId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          startTransition(async () => {
            const result = await retryMeetingAnalysisAction(meetingId);
            if (!result.ok) {
              setMsg(
                result.error === "FORBIDDEN"
                  ? "Vous ne pouvez pas relancer cette analyse."
                  : result.error === "NOT_RETRYABLE"
                    ? "Ce rendez-vous n'est pas en attente d'analyse."
                    : "Impossible de relancer l'analyse. Réessayez dans un instant.",
              );
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Relance en cours…" : "Relancer l'analyse automatique"}
      </Button>
      {msg ? (
        <p className="text-destructive text-sm" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
