"use client";

import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { useMemo } from "react";
import {
  meetingEtapeLabel,
  meetingEtapePillClass,
} from "@/lib/meeting-etape-pill";
import { cn } from "@/lib/utils";
import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";

export type MeetingMatrixPoint = {
  id: string;
  prospectName: string;
  salesScore: number | null;
  potentialEur: number;
  outcome: MeetingOutcome;
};

const OUTCOME_ORDER: MeetingOutcome[] = [
  "OTHER",
  "FOLLOW_UP",
  "WON",
  "LOST",
  "NO_SHOW",
];

/** Brand-aligned scatter colors per étape (hex for MUI). */
const OUTCOME_COLOR: Record<MeetingOutcome, string> = {
  OTHER: "#8b5cf6",
  FOLLOW_UP: "#10b981",
  WON: "#0ea5e9",
  LOST: "#f43f5e",
  NO_SHOW: "#f59e0b",
};

const eurCompact = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  notation: "compact",
});

export function MeetingMatrixScatter({
  points,
  height = 320,
}: {
  points: MeetingMatrixPoint[];
  height?: number;
}) {
  const series = useMemo(() => {
    return OUTCOME_ORDER.map((outcome) => {
      const rows = points.filter((p) => p.outcome === outcome);
      return {
        label: meetingEtapeLabel(outcome),
        data: rows.map((p) => ({
          id: p.id,
          x: p.salesScore ?? 0,
          y: p.potentialEur,
        })),
        color: OUTCOME_COLOR[outcome],
        markerSize: 6,
      };
    }).filter((s) => s.data.length > 0);
  }, [points]);

  const presentOutcomes = useMemo(
    () => OUTCOME_ORDER.filter((o) => points.some((p) => p.outcome === o)),
    [points],
  );

  if (points.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun rendez-vous à analyser pour l’instant.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ScatterChart
        height={height}
        series={series}
        xAxis={[
          {
            label: "SalesScore",
            min: 0,
            max: 100,
          },
        ]}
        yAxis={[
          {
            label: "Potentiel (€)",
            valueFormatter: (v: number) => eurCompact.format(v),
          },
        ]}
        grid={{ vertical: true, horizontal: true }}
        hideLegend
        margin={{ top: 16, right: 16, bottom: 44, left: 64 }}
      />
      <div className="flex flex-wrap items-center gap-2">
        {presentOutcomes.map((outcome) => (
          <span
            key={outcome}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              meetingEtapePillClass(outcome),
            )}
          >
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: OUTCOME_COLOR[outcome] }}
              aria-hidden
            />
            {meetingEtapeLabel(outcome)}
          </span>
        ))}
      </div>
    </div>
  );
}
