"use client";

import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { useMemo } from "react";
import {
  meetingEtapePillClassForLabel,
  meetingEtapeScatterColorForLabel,
} from "@/lib/meeting-etape-pill";
import { cn } from "@/lib/utils";
import {
  MATRIX_AXIS_MAX,
  MATRIX_AXIS_MIN,
  MATRIX_AXIS_TICKS,
  type QualificationPotentialMatrixPoint,
} from "@/src/core/domain/meeting-analyse-matrices";
import {
  QualificationMatrixScatterTooltip,
  type QualificationMatrixScatterTooltipMeta,
} from "@/components/molecules/qualification-matrix-scatter-tooltip";

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

function sortedUniqueEtapes(points: QualificationPotentialMatrixPoint[]): string[] {
  return [...new Set(points.map((p) => p.etape))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}

export function QualificationPotentialMatrixScatter({
  points,
  height = 420,
}: {
  points: QualificationPotentialMatrixPoint[];
  height?: number;
}) {
  const presentEtapes = useMemo(() => sortedUniqueEtapes(points), [points]);

  const series = useMemo(() => {
    return presentEtapes.map((etape) => {
      const rows = points.filter((p) => p.etape === etape);
      return {
        id: `etape-${etape}`,
        label: etape,
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
        color: meetingEtapeScatterColorForLabel(etape),
        markerSize: 8,
      };
    }).filter((s) => s.data.length > 0);
  }, [points, presentEtapes]);

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
        {presentEtapes.map((etape) => (
          <span
            key={etape}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              meetingEtapePillClassForLabel(etape),
            )}
          >
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: meetingEtapeScatterColorForLabel(etape) }}
              aria-hidden
            />
            {etape}
          </span>
        ))}
      </div>
    </div>
  );
}
