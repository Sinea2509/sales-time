"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { runMeetingAnalysisAction } from "@/app/[locale]/company/analyse/actions";
import { formatMeetingAnalysisActionError } from "@/lib/analysis-action-errors";
import { Button } from "@/components/ui/button";

type Props = { meetingId: string };

export function MeetingAnalysisButtons({ meetingId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run(kind: "SONCAS" | "DISC" | "KISS") {
    setMsg(null);
    startTransition(async () => {
      const res = await runMeetingAnalysisAction(meetingId, kind);
      if (!res.ok) {
        setMsg(formatMeetingAnalysisActionError(res));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => run("SONCAS")}
        >
          Analyser SONCAS
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => run("DISC")}
        >
          Analyser DISC
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => run("KISS")}
        >
          Analyser KISS
        </Button>
      </div>
      {msg ? (
        <p className="text-destructive text-sm" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
