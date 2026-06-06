"use client";

import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { useMemo } from "react";
import {
  meetingEtapeLabel,
  meetingEtapePillClass,
} from "@/lib/meeting-etape-pill";
import { cn } from "@/lib/utils";
import {
  MATRIX_AXIS_MAX,
  MATRIX_AXIS_MIN,
  MATRIX_AXIS_TICKS,
  type QualificationPotentialMatrixPoint,
} from "@/src/core/domain/meeting-analyse-matrices";
import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import {
  QualificationMatrixScatterTooltip,
  type QualificationMatrixScatterTooltipMeta,
} from "@/components/molecules/qualification-matrix-scatter-tooltip";

const OUTCOME_ORDER: MeetingOutcome[] = [
  "OTHER",
  "FOLLOW_UP",
  "WON",
  "LOST",
  "NO_SHOW",
];

const OUTCOME_COLOR: Record<MeetingOutcome, string> = {
  OTHER: "#8b5cf6",
  FOLLOW_UP: "#10b981",
  WON: "#0ea5e9",
  LOST: "#f43f5e",
  NO_SHOW: "#f59e0b",
};

const ORIGIN_LINE_STYLE = {
  stroke: "#0ea5e9",
  strokeWidth: 1.5,
  strokeDasharray: "6 4",
};

const compactTickLabel = { fontSize: 10 };
const compactAxisLabel = { fontSize: 11 };

const matrixAxisConfig = {
  scaleType: "linear" as const,
  min: MATRIX_AXIS_MIN,
  max: MATRIX_AXIS_MAX,
  domainLimit: "strict" as const,
  tickNumber: MATRIX_AXIS_TICKS.length,
  tickLabelInterval: () => true,
  tickSize: 4,
  tickLabelStyle: compactTickLabel,
  labelStyle: compactAxisLabel,
  valueFormatter: (value: number | null) =>
    value == null ? "" : String(Math.round(value)),
};

export function QualificationPotentialMatrixScatter({
  points,
  height = 420,
}: {
  points: QualificationPotentialMatrixPoint[];
  height?: number;
}) {
  const series = useMemo(() => {
    return OUTCOME_ORDER.map((outcome) => {
      const rows = points.filter((p) => p.outcome === outcome);
      return {
        id: `outcome-${outcome}`,
        label: meetingEtapeLabel(outcome),
        data: rows.map((p) => {
          const meta: QualificationMatrixScatterTooltipMeta = {
            contactName: p.prospectName,
            potentialAmount: p.potentialAmount,
            salesScore: p.salesScore,
          };
          return {
            id: p.id,
            x: p.qualification,
            y: p.potential,
            z: meta,
          };
        }),
        color: OUTCOME_COLOR[outcome],
        markerSize: 8,
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
        id: "axis-placeholder",
        label: "",
        data: [{ id: "__axis-placeholder__", x: 0, y: 0 }],
        color: "transparent",
        markerSize: 0,
      },
    ];
  }, [series]);

  return (
    <div className="w-full space-y-2">
      <ScatterChart
        height={height}
        series={chartSeries}
        slots={{ tooltip: QualificationMatrixScatterTooltip }}
        xAxis={[
          {
            id: "qualification",
            ...matrixAxisConfig,
            label: "Qualification",
            height: 28,
          },
        ]}
        yAxis={[
          {
            id: "potential",
            ...matrixAxisConfig,
            label: "Potentiel",
            width: 30,
          },
        ]}
        grid={{ vertical: true, horizontal: true }}
        hideLegend
        hitAreaRadius={24}
        margin={{ top: 8, right: 8, bottom: 32, left: 36 }}
        slotProps={{
          tooltip: { trigger: "item" },
          axisTickLabel: { style: compactTickLabel },
          axisLabel: { style: compactAxisLabel },
        }}
      >
        <ChartsReferenceLine
          x={0}
          axisId="qualification"
          lineStyle={ORIGIN_LINE_STYLE}
        />
        <ChartsReferenceLine
          y={0}
          axisId="potential"
          lineStyle={ORIGIN_LINE_STYLE}
        />
      </ScatterChart>
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
