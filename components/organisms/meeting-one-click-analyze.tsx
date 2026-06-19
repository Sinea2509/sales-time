"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { runAllMeetingAnalysesAction } from "@/app/[locale]/company/rendez-vous/[id]/actions";
import { formatMeetingAnalysisActionError } from "@/lib/analysis-action-errors";
import { Button } from "@/components/ui/button";

export function MeetingOneClickAnalyze({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="bg-brand text-white hover:bg-brand-hover"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          startTransition(async () => {
            const r = await runAllMeetingAnalysesAction(meetingId);
            if (!r.ok) {
              setMsg(formatMeetingAnalysisActionError(r));
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending
          ? "Analyse en cours…"
          : "Analyser ce RDV (SONCAS + DISC + KISS)"}
      </Button>
      {msg ? (
        <p className="text-destructive text-sm" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
