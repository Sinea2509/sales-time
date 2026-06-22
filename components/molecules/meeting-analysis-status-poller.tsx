"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";

const POLL_MS = 5_000;

export function MeetingAnalysisStatusPoller({
  status,
}: {
  status: MeetingStatus;
}) {
  const router = useRouter();

  useEffect(() => {
    if (status !== "PROCESSING") return;

    const intervalId = window.setInterval(() => {
      router.refresh();
    }, POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [status, router]);

  return null;
}
