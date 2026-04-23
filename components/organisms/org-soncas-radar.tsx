"use client";

import { RadarChart } from "@mui/x-charts/RadarChart";
import type { SoncasDriverAverages } from "@/lib/org-soncas-team-aggregate";

const METRICS = [
  "Sécurité",
  "Orgueil",
  "Nouveauté",
  "Confort",
  "Argent",
  "Sympathie",
] as const;

function seriesData(averages: SoncasDriverAverages): number[] {
  return [
    averages.securite ?? 0,
    averages.orgueil ?? 0,
    averages.nouveaute ?? 0,
    averages.confort ?? 0,
    averages.argent ?? 0,
    averages.sympathie ?? 0,
  ];
}

export function OrgSoncasRadar({
  averages,
  seriesLabel = "Équipe",
  height = 280,
}: {
  averages: SoncasDriverAverages;
  seriesLabel?: string;
  height?: number;
}) {
  const data = seriesData(averages);
  const hasAny = data.some((v) => v > 0);

  if (!hasAny) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm dark:text-zinc-500">
        Pas assez d’analyses SONCAS sur la période pour afficher le radar.
      </p>
    );
  }

  return (
    <div className="w-full">
      <RadarChart
        height={height}
        series={[
          {
            label: seriesLabel,
            data,
            fillArea: true,
            color: "#6C4DFF",
          },
        ]}
        radar={{
          max: 100,
          metrics: METRICS.map((name) => ({ name, max: 100 })),
        }}
        shape="circular"
        divisions={4}
        hideLegend
      />
    </div>
  );
}
