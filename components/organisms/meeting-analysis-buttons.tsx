"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  runDiscAnalysisAction,
  runKissAnalysisAction,
  runSoncasAnalysisAction,
} from "@/app/[locale]/company/analyse/actions";
import { Button } from "@/components/ui/button";

type Props = { meetingId: string };

export function MeetingAnalysisButtons({ meetingId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run(kind: "SONCAS" | "DISC" | "KISS") {
    setMsg(null);
    startTransition(async () => {
      const res =
        kind === "SONCAS"
          ? await runSoncasAnalysisAction(meetingId)
          : kind === "DISC"
            ? await runDiscAnalysisAction(meetingId)
            : await runKissAnalysisAction(meetingId);
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
