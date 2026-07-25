"use client";

import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { useMemo } from "react";
import {
  meetingEtapePillClassForLabel,
  meetingEtapeScatterColorForLabel,
} from "@/lib/meeting-etape-pill";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { cn } from "@/lib/utils";

export type MeetingMatrixPoint = {
  id: string;
  prospectName: string;
  salesScore: number | null;
  /** TAM estimé (minutes / RDV) selon paramètres org. */
  tamMinutes: number;
  etape: string;
};

function sortedUniqueEtapes(points: MeetingMatrixPoint[]): string[] {
  return [...new Set(points.map((p) => p.etape))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}

export function MeetingMatrixScatter({
  points,
  height = 320,
}: {
  points: MeetingMatrixPoint[];
  height?: number;
}) {
  const presentEtapes = useMemo(() => sortedUniqueEtapes(points), [points]);

  const series = useMemo(() => {
    return presentEtapes
      .map((etape) => {
        const rows = points.filter((p) => p.etape === etape);
        return {
          label: etape,
          data: rows.map((p) => ({
            id: p.id,
            x: p.salesScore ?? 0,
            y: p.tamMinutes,
          })),
          color: meetingEtapeScatterColorForLabel(etape),
          markerSize: 6,
        };
      })
      .filter((s) => s.data.length > 0);
  }, [points, presentEtapes]);

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
          Aucun rendez-vous à afficher : les axes sont prêts pour les prochains
          RDV analysés.
        </p>
      ) : null}
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
              style={{
                backgroundColor: meetingEtapeScatterColorForLabel(etape),
              }}
              aria-hidden
            />
            {etape}
          </span>
        ))}
      </div>
    </div>
  );
}
