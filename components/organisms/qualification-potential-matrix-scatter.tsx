"use client";

import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { useMemo } from "react";
import {
  meetingEtapePillClassForLabel,
  meetingEtapeScatterColorForLabel,
} from "@/lib/meeting-etape-pill";
import { sellerScatterStylesByUserId } from "@/lib/seller-scatter-colors";
import { ChartTheme } from "@/components/atoms/chart-theme";
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
import { QualificationMatrixQuadrantLabels } from "@/components/molecules/qualification-matrix-quadrant-labels";
import { quadrantDeLaMatrice } from "@/src/core/domain/matrice-quadrants";

/*
  La croix du repère portait le bleu « Proposition », c'est-à-dire la couleur
  exacte d'une des séries de points du même graphique. Une ligne de repère
  peinte comme une donnée se lit comme une donnée : on cherche à quel RDV elle
  correspond. Elle prend maintenant l'encre de chrome du thème, qui n'est
  attribuée à aucune série et suit le mode clair ou sombre toute seule.
*/
const ORIGIN_LINE_STYLE = {
  stroke: "var(--chart-ink)",
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

function sortedUniqueEtapes(
  points: QualificationPotentialMatrixPoint[],
): string[] {
  return [...new Set(points.map((p) => p.etape))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}

function tooltipMetaFromPoint(
  point: QualificationPotentialMatrixPoint,
  options?: { includeSeller?: boolean },
): QualificationMatrixScatterTooltipMeta {
  const quadrant = quadrantDeLaMatrice(point);
  return {
    contactName: point.prospectName,
    potentialAmount: point.potentialAmount,
    salesScore: point.salesScore,
    sellerDisplayName: options?.includeSeller
      ? point.sellerDisplayName
      : undefined,
    // Un point posé sur un axe n'a pas de quadrant, donc pas d'action :
    // l'info-bulle saute la ligne plutôt que d'en inventer une.
    quadrantAction: quadrant?.action ?? null,
    quadrantRaison: quadrant?.raison ?? null,
  };
}

function buildEtapeSeries(points: QualificationPotentialMatrixPoint[]): {
  series: ScatterSeries[];
  legend: LegendItem[];
} {
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

function buildSellerSeries(points: QualificationPotentialMatrixPoint[]): {
  series: ScatterSeries[];
  legend: LegendItem[];
} {
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
  /** Vue manager : une couleur par commercial. */
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
        data: [
          {
            id: "__axis-placeholder__",
            x: 0,
            y: 0,
            z: {} as QualificationMatrixScatterTooltipMeta,
          },
        ],
        color: "transparent",
        markerSize: 0,
      },
    ];
  }, [series]);

  const isEmpty = series.length === 0;

  return (
    <div className="w-full space-y-2">
      {/*
        Sans message, la matrice vide dessinait deux axes gradués et rien
        d'autre. Deux axes nus se lisent comme un graphique qui n'a pas fini de
        charger, ou comme une panne : le lecteur attend des points qui ne
        viendront jamais. La phrase dit pourquoi il n'y en a pas, et quoi faire
        pour qu'il y en ait.
      */}
      <div className="relative">
        {isEmpty ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
            <p className="text-muted-foreground bg-card/85 max-w-xs rounded-lg px-3 py-2 text-center text-sm text-balance">
              Aucun rendez-vous à placer. Un rendez-vous n&apos;apparaît ici
              qu&apos;une fois analysé et doté d&apos;un montant potentiel.
            </p>
          </div>
        ) : null}
        <ChartTheme>
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
            {/*
              Sans point à ranger, quatre consignes d'action posées sur un
              repère vide donneraient des ordres sur rien.
            */}
            {isEmpty ? null : <QualificationMatrixQuadrantLabels />}
          </ScatterChart>
        </ChartTheme>
      </div>
      {/*
        Les deux axes ne se lisent pas de la même façon, et rien ne le disait :
        l'abscisse est une note absolue, l'ordonnée une position relative aux
        autres rendez-vous de la période. Deux points identiques sur l'écran
        peuvent donc porter des montants très différents d'une période à
        l'autre, ce qui reste incompréhensible tant que la règle n'est pas
        écrite.
      */}
      <p className="text-muted-foreground text-xs text-balance">
        Horizontale : le SalesScore du rendez-vous, 50 au centre. Verticale :
        son montant potentiel, comparé aux autres rendez-vous de la période.
      </p>
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
