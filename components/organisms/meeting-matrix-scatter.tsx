"use client";

import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { useMemo } from "react";
import {
  meetingEtapeLabel,
  meetingEtapePillClass,
} from "@/lib/meeting-etape-pill";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { cn } from "@/lib/utils";
import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";

export type MeetingMatrixPoint = {
  id: string;
  prospectName: string;
  salesScore: number | null;
  /** TAM estimé (minutes / RDV) selon paramètres org. */
  tamMinutes: number;
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
          y: p.tamMinutes,
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

  const chartSeries = useMemo(() => {
    if (series.length > 0) return series;
    return [
      {
        label: "",
        data: [{ id: "__axis-placeholder__", x: 50, y: 30 }],
        color: "transparent",
        markerSize: 0,
      },
    ];
  }, [series]);

  const yMax = useMemo(() => {
    if (points.length === 0) return 60;
    const maxTam = Math.max(...points.map((p) => p.tamMinutes));
    return Math.max(60, Math.ceil(maxTam / 10) * 10);
  }, [points]);

  return (
    <div className="space-y-3">
      <ScatterChart
        height={height}
        series={chartSeries}
        xAxis={[
          {
            label: "SalesScore",
            min: 0,
            max: 100,
          },
        ]}
        yAxis={[
          {
            label: "TAM (min / RDV)",
            min: 0,
            max: yMax,
            valueFormatter: (v: number) => formatDurationHoursMinutes(v),
          },
        ]}
        grid={{ vertical: true, horizontal: true }}
        hideLegend
        margin={{ top: 16, right: 16, bottom: 44, left: 64 }}
      />
      {points.length === 0 ? (
        <p className="text-muted-foreground text-center text-xs">
          Aucun rendez-vous à afficher — axes prêts pour les prochains RDV
          analysés.
        </p>
      ) : null}
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
