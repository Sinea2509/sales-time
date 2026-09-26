"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { plurielFr } from "@/lib/pluriel-fr";
import { cn } from "@/lib/utils";
import type { MeetingAnalysisProgress } from "@/src/core/domain/meeting-analysis-progress";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";

/**
 * Durée au bout de laquelle la barre a parcouru les deux tiers d'une étape
 * en cours. Elle s'en approche sans jamais l'atteindre : l'étape ne se coche
 * que quand le serveur l'a réellement écrite.
 */
const STEP_CREEP_MS = 25_000;
const CREEP_CEILING = 0.88;
const TICK_MS = 200;

function creepFraction(elapsedMs: number): number {
  const raw = 1 - Math.exp(-elapsedMs / STEP_CREEP_MS);
  return Math.min(raw, CREEP_CEILING);
}

/**
 * Le remplissage montré : les étapes faites, plus une avance progressive sur
 * celles qui tournent. Avec trois étapes lancées ensemble, l'avance porte
 * sur les trois, puisqu'elles finiront à peu près en même temps.
 */
function displayedPercent(
  progress: MeetingAnalysisProgress,
  elapsedMs: number,
): number {
  if (progress.totalCount === 0) return 0;
  const running = progress.runningCount * creepFraction(elapsedMs);
  const value = ((progress.doneCount + running) / progress.totalCount) * 100;
  return Math.max(2, Math.min(99, value));
}

function StepIcon({ state }: { state: "done" | "running" | "pending" }) {
  if (state === "done") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500">
        <Check className="size-3" aria-hidden />
      </span>
    );
  }
  if (state === "running") {
    return (
      <span className="text-brand flex size-5 shrink-0 items-center justify-center">
        <Loader2
          className="size-4 animate-spin motion-reduce:animate-none"
          aria-hidden
        />
      </span>
    );
  }
  return (
    <span className="flex size-5 shrink-0 items-center justify-center">
      <span className="size-2 rounded-full border border-border bg-muted" />
    </span>
  );
}

export function MeetingAnalysisProgressCard({
  status,
  progress,
}: {
  status: MeetingStatus;
  progress: MeetingAnalysisProgress;
}) {
  /*
    Le chronomètre repart à chaque étape cochée : l'avance progressive décrit
    l'attente de l'étape en cours, pas celle du traitement entier. Le nombre
    d'étapes faites est gardé avec l'horloge pour qu'un tic de l'ancienne
    étape, arrivé après le rendu de la nouvelle, ne fasse pas sauter la barre.
  */
  const [clock, setClock] = useState<{
    doneCount: number;
    startedAt: number;
    now: number;
  } | null>(null);

  useEffect(() => {
    if (status !== "PROCESSING") return;
    const doneCount = progress.doneCount;
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      setClock({ doneCount, startedAt, now: Date.now() });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [status, progress.doneCount]);

  if (status !== "PROCESSING") return null;

  const elapsedMs =
    clock && clock.doneCount === progress.doneCount
      ? clock.now - clock.startedAt
      : 0;
  const percent = displayedPercent(progress, elapsedMs);
  const remaining = progress.totalCount - progress.doneCount;
  const runningLabels = progress.steps
    .filter((s) => s.state === "running")
    .map((s) => s.label);

  return (
    <Card className="border-brand/30 bg-brand/5">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className={cardTitleClass}>Analyse en cours</h2>
          <p className="text-muted-foreground text-sm tabular-nums">
            {progress.doneCount} sur {progress.totalCount}{" "}
            {plurielFr(progress.totalCount, "étape")}
            {remaining > 0
              ? ` · encore ${remaining} ${plurielFr(remaining, "étape")}`
              : null}
          </p>
        </div>

        <div
          role="progressbar"
          aria-label="Avancement de l'analyse automatique"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
          className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="from-brand relative h-full overflow-hidden rounded-full bg-gradient-to-r to-violet-400 transition-[width] duration-700 ease-out motion-reduce:transition-none dark:to-violet-300"
            style={{ width: `${percent}%` }}
          >
            <span
              aria-hidden
              className="absolute inset-0 animate-[st-progress-shimmer_1.8s_linear_infinite] bg-gradient-to-r from-transparent via-white/45 to-transparent motion-reduce:hidden"
            />
          </div>
        </div>

        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {progress.steps.map((step) => (
            <li
              key={step.key}
              className={cn(
                "flex items-center gap-2 text-sm",
                step.state === "done" && "text-foreground",
                step.state === "running" && "text-brand font-medium",
                step.state === "pending" && "text-muted-foreground",
              )}
            >
              <StepIcon state={step.state} />
              <span>{step.label}</span>
            </li>
          ))}
        </ol>

        <p className="text-muted-foreground text-xs">
          {runningLabels.length > 0
            ? `En cours : ${runningLabels.join(", ")}. `
            : null}
          Les résultats s&apos;affichent dès qu&apos;ils sont prêts, vous pouvez
          rester sur cette page.
        </p>
      </CardContent>
    </Card>
  );
}
