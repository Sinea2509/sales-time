"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";

/*
  Quatre secondes : assez court pour que chaque étape cochée apparaisse sans
  que le commercial ait le temps de douter, assez long pour que le serveur ne
  rende pas la fiche plus souvent qu'une étape ne s'écrit.
*/
const POLL_MS = 4_000;

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
