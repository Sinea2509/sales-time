"use client";

import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { useMemo } from "react";
import {
  meetingEtapePillClassForLabel,
  meetingEtapeScatterColorForLabel,
} from "@/lib/meeting-etape-pill";
import { sellerScatterStylesByUserId } from "@/lib/seller-scatter-colors";
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

type ScatterSeries = {
  id: string;
  label: string;
  data: Array<{
    id: string;
    x: number;
    y: number;
    z: QualificationMatrixScatterTooltipMeta;
  }>;
  color: string;
  markerSize: number;
};

type LegendItem = {
  key: string;
  label: string;
  color: string;
  pillClass: string;
  count?: number;
};

function sortedUniqueEtapes(points: QualificationPotentialMatrixPoint[]): string[] {
  return [...new Set(points.map((p) => p.etape))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}

function tooltipMetaFromPoint(
  point: QualificationPotentialMatrixPoint,
  options?: { includeSeller?: boolean },
): QualificationMatrixScatterTooltipMeta {
  return {
    contactName: point.prospectName,
    potentialAmount: point.potentialAmount,
    salesScore: point.salesScore,
    sellerDisplayName: options?.includeSeller
      ? point.sellerDisplayName
      : undefined,
  };
}

function buildEtapeSeries(
  points: QualificationPotentialMatrixPoint[],
): { series: ScatterSeries[]; legend: LegendItem[] } {
  const presentEtapes = sortedUniqueEtapes(points);
  const series = presentEtapes
    .map((etape) => {
      const rows = points.filter((p) => p.etape === etape);
      return {
        id: `etape-${etape}`,
        label: etape,
        data: rows.map((p) => ({
          id: p.id,
          x: p.qualification,
          y: p.potential,
          z: tooltipMetaFromPoint(p),
        })),
        color: meetingEtapeScatterColorForLabel(etape),
        markerSize: 8,
      };
    })
    .filter((s) => s.data.length > 0);

  const legend = presentEtapes.map((etape) => ({
    key: etape,
    label: etape,
    color: meetingEtapeScatterColorForLabel(etape),
    pillClass: meetingEtapePillClassForLabel(etape),
  }));

  return { series, legend };
}

function buildSellerSeries(
  points: QualificationPotentialMatrixPoint[],
): { series: ScatterSeries[]; legend: LegendItem[] } {
  const sellerStyles = sellerScatterStylesByUserId(points);
  const countsBySeller = new Map<string, number>();
  for (const point of points) {
    countsBySeller.set(
      point.sellerUserId,
      (countsBySeller.get(point.sellerUserId) ?? 0) + 1,
    );
  }

  const series = [...sellerStyles.entries()]
    .map(([sellerUserId, style]) => {
      const rows = points.filter((p) => p.sellerUserId === sellerUserId);
      return {
        id: `seller-${sellerUserId}`,
        label: style.label,
        data: rows.map((p) => ({
          id: p.id,
          x: p.qualification,
          y: p.potential,
          z: tooltipMetaFromPoint(p, { includeSeller: true }),
        })),
        color: style.color,
        markerSize: 8,
      };
    })
    .filter((s) => s.data.length > 0);

  const legend = [...sellerStyles.entries()].map(([sellerUserId, style]) => ({
    key: sellerUserId,
    label: style.label,
    color: style.color,
    pillClass: style.pillClass,
    count: countsBySeller.get(sellerUserId) ?? 0,
  }));

  return { series, legend };
}

export function QualificationPotentialMatrixScatter({
  points,
  height = 420,
  legendMode = "etape",
}: {
  points: QualificationPotentialMatrixPoint[];
  height?: number;
  /** Vue manager — une couleur par commercial. */
  legendMode?: "etape" | "seller";
}) {
  const { series, legend } = useMemo(() => {
    if (legendMode === "seller") return buildSellerSeries(points);
    return buildEtapeSeries(points);
  }, [legendMode, points]);

  const chartSeries = useMemo(() => {
    if (series.length > 0) return series;
    return [
      {
        id: "axis-placeholder",
        label: "",
        data: [{ id: "__axis-placeholder__", x: 0, y: 0, z: {} as QualificationMatrixScatterTooltipMeta }],
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
        {legend.map((item) => (
          <span
            key={item.key}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              item.pillClass,
            )}
          >
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            {item.label}
            {item.count != null ? (
              <span className="text-muted-foreground tabular-nums">
                ({item.count})
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
