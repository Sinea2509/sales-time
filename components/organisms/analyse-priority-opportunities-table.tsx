"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";

export type AnalysePriorityOpportunityRow = {
  id: string;
  prospectName: string;
  potentialAmount: number;
  salesScore: number | null;
  outcome: MeetingOutcome;
};

const euroFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const SCORE_AXIS_TICKS = [0, 25, 50, 75, 100] as const;
const TOP_OPPORTUNITIES = 10;
const EMPTY_ROW_COUNT = 10;
const ROW_HEIGHT = 36;

function clampScore(score: number | null): number | null {
  if (score == null) return null;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function barLabel(row: AnalysePriorityOpportunityRow): string {
  return `${row.prospectName} - ${euroFormat.format(row.potentialAmount)}`;
}

function ScoreGridBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden
    >
      {SCORE_AXIS_TICKS.map((tick) => (
        <div
          key={tick}
          className={cn(
            "absolute top-0 bottom-0 border-l border-dashed",
            tick === 0 || tick === 100
              ? "border-neutral-300/80 dark:border-neutral-600/80"
              : "border-neutral-200/90 dark:border-neutral-700/70",
          )}
          style={{ left: `${tick}%` }}
        />
      ))}
    </div>
  );
}

function ScoreGridXAxis({ className }: { className?: string }) {
  return (
    <div className={cn("relative mt-2 h-4", className)}>
      {SCORE_AXIS_TICKS.map((tick) => (
        <span
          key={tick}
          className="text-muted-foreground absolute -translate-x-1/2 text-[11px] font-medium tabular-nums"
          style={{ left: `${tick}%` }}
        >
          {tick}
        </span>
      ))}
    </div>
  );
}

function PriorityBarRow({
  rank,
  row,
}: {
  rank: number;
  row?: AnalysePriorityOpportunityRow;
}) {
  const score = row ? clampScore(row.salesScore) : null;
  const isLead = rank === 1;
  const barWidth =
    score != null ? Math.max(score, 12) : row != null ? 12 : 0;

  const bar = row ? (
    <Link
      href={`/company/rendez-vous/${row.id}`}
      className={cn(
        "absolute inset-y-0 left-0 flex items-center overflow-hidden rounded-full px-3 transition-opacity hover:opacity-90",
        isLead
          ? "bg-emerald-400/90 dark:bg-emerald-500/85"
          : "bg-sky-400/90 dark:bg-sky-500/85",
      )}
      style={{ width: `${barWidth}%` }}
      aria-label={barLabel(row)}
    >
      <span
        className={cn(
          "truncate text-xs font-semibold",
          isLead
            ? "text-emerald-950 dark:text-emerald-50"
            : "text-sky-950 dark:text-sky-50",
        )}
      >
        {barLabel(row)}
      </span>
    </Link>
  ) : null;

  return (
    <div
      className="relative flex items-center gap-2"
      style={{ height: ROW_HEIGHT }}
    >
      <span className="text-muted-foreground w-5 shrink-0 text-right text-xs font-medium tabular-nums">
        {rank}
      </span>
      <div className="relative h-7 min-w-0 flex-1">{bar}</div>
    </div>
  );
}

export function AnalysePriorityOpportunitiesTable({
  rows,
}: {
  rows: AnalysePriorityOpportunityRow[];
}) {
  const displayRows = rows.slice(0, TOP_OPPORTUNITIES);
  const isEmpty = displayRows.length === 0;

  return (
    <div className="space-y-1">
      <div
        className="relative"
        style={{
          minHeight: isEmpty
            ? EMPTY_ROW_COUNT * ROW_HEIGHT
            : displayRows.length * ROW_HEIGHT,
        }}
      >
        <ScoreGridBackground className="left-7 right-0" />

        {isEmpty ? (
          <p className="text-muted-foreground pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm">
            Aucun rendez-vous avec un potentiel renseigné pour l&apos;instant.
          </p>
        ) : null}

        <div className="relative z-[1] space-y-0">
          {isEmpty
            ? Array.from({ length: EMPTY_ROW_COUNT }, (_, index) => (
                <PriorityBarRow key={index + 1} rank={index + 1} />
              ))
            : displayRows.map((row, index) => (
                <PriorityBarRow key={row.id} rank={index + 1} row={row} />
              ))}
        </div>
      </div>

      <ScoreGridXAxis className="ml-7 mr-0" />
    </div>
  );
}
