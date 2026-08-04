"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  getTeamMemberPerformanceFingerprintAction,
  refreshTeamMemberPerformanceAction,
} from "@/app/[locale]/company/equipe/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MEETING_MUTATION_EVENT,
  type MeetingMutationDetail,
} from "@/lib/meeting-mutation-event";
import {
  cardProseBodyClass,
  cardSubsectionTitleClass,
  cardTitleClass,
} from "@/lib/page-typography";
import { cn } from "@/lib/utils";

type PerformanceState = {
  performanceForces: string | null;
  performanceAxes: string | null;
  performanceStop: string | null;
};

export function TeamMemberPerformanceProfileCard({
  sellerUserId,
  statsWindowDays,
  initialFingerprint,
  initialPerformance,
}: {
  sellerUserId: string;
  statsWindowDays: number;
  initialFingerprint: string;
  initialPerformance: PerformanceState;
}) {
  const fingerprintRef = useRef(initialFingerprint);
  const [performance, setPerformance] = useState(initialPerformance);
  const [refreshing, startRefresh] = useTransition();

  const refreshIfStale = useCallback(() => {
    startRefresh(async () => {
      const fp = await getTeamMemberPerformanceFingerprintAction(
        sellerUserId,
        statsWindowDays,
      );
      if (!fp.ok) return;
      if (fp.fingerprint === fingerprintRef.current) return;

      const res = await refreshTeamMemberPerformanceAction(
        sellerUserId,
        statsWindowDays,
      );
      if (!res.ok) return;

      fingerprintRef.current = res.profile.fingerprint;
      setPerformance({
        performanceForces: res.profile.performanceForces,
        performanceAxes: res.profile.performanceAxes,
        performanceStop: res.profile.performanceStop,
      });
    });
  }, [sellerUserId, statsWindowDays]);

  useEffect(() => {
    function onMeetingMutated(event: Event) {
      const detail = (event as CustomEvent<MeetingMutationDetail>).detail;
      if (detail?.sellerUserId !== sellerUserId) return;
      refreshIfStale();
    }

    function onVisible() {
      if (document.visibilityState !== "visible") return;
      refreshIfStale();
    }

    window.addEventListener(MEETING_MUTATION_EVENT, onMeetingMutated);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(MEETING_MUTATION_EVENT, onMeetingMutated);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshIfStale, sellerUserId]);

  return (
    <Card
      size="sm"
      className="overflow-hidden border-border bg-card shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <CardHeader className="pb-3">
        <CardTitle
          className={cn(
            cardTitleClass,
            "flex flex-row items-center justify-between gap-2",
          )}
        >
          <span className="flex items-center gap-2">
            Profil de performance
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100/90 ring-1 ring-violet-300/50 dark:bg-violet-950/60 dark:ring-violet-700/40"
              aria-hidden
            >
              <Sparkles
                className="size-3 text-violet-600 drop-shadow-[0_0_6px_rgba(139,92,246,0.4)] dark:text-violet-300 dark:drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]"
                strokeWidth={2}
              />
            </span>
          </span>
          {refreshing ? (
            <Loader2
              className="text-muted-foreground size-4 shrink-0 animate-spin"
              aria-label="Mise à jour du profil de performance"
            />
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-8">
          <section>
            <h3 className={cardSubsectionTitleClass}>Forces</h3>
            <p
              className={cn(
                cardProseBodyClass,
                "mt-2 whitespace-pre-wrap dark:text-zinc-200/90",
              )}
            >
              {performance.performanceForces}
            </p>
          </section>
          <section>
            <h3 className={cardSubsectionTitleClass}>
              Axes d&apos;amélioration
            </h3>
            <p
              className={cn(
                cardProseBodyClass,
                "mt-2 whitespace-pre-wrap dark:text-zinc-200/90",
              )}
            >
              {performance.performanceAxes}
            </p>
          </section>
          <section>
            <h3 className={cardSubsectionTitleClass}>À stopper</h3>
            <p
              className={cn(
                cardProseBodyClass,
                "mt-2 whitespace-pre-wrap dark:text-zinc-200/90",
              )}
            >
              {performance.performanceStop}
            </p>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
