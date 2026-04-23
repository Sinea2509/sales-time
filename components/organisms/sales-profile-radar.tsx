"use client";

import { RadarChart } from "@mui/x-charts/RadarChart";

export type SalesProfileScores = {
  assertivite: number;
  ecouteActive: number;
  capitalSympathie: number;
  argumentation: number;
  objections: number;
  nextSteps: number;
};

const METRICS = [
  "Assertivité",
  "Écoute active",
  "Capital Sympathie",
  "Argumentation",
  "Objections",
  "Next steps",
] as const;

export function SalesProfileRadar({
  scores,
  seriesLabel = "Mon profil",
  height = 280,
}: {
  scores: SalesProfileScores;
  seriesLabel?: string;
  height?: number;
}) {
  const data = [
    scores.assertivite,
    scores.ecouteActive,
    scores.capitalSympathie,
    scores.argumentation,
    scores.objections,
    scores.nextSteps,
  ];

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
