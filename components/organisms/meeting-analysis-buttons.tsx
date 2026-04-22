"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  runDiscAnalysisAction,
  runSoncasAnalysisAction,
} from "@/app/dashboard/analyse/actions";
import { Button } from "@/components/ui/button";

type Props = { meetingId: string };

export function MeetingAnalysisButtons({ meetingId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run(kind: "SONCAS" | "DISC") {
    setMsg(null);
    startTransition(async () => {
      const res =
        kind === "SONCAS"
          ? await runSoncasAnalysisAction(meetingId)
          : await runDiscAnalysisAction(meetingId);
      if (!res.ok) {
        setMsg(
          res.message ??
            (res.error === "PROMPT_NOT_CONFIGURED"
              ? "Exécutez le seed Prisma (prompts manquants)."
              : res.error),
        );
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
      </div>
      {msg ? (
        <p className="text-destructive text-sm" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
