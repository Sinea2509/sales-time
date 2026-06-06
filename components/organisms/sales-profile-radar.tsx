"use client";

import { RadarChart } from "@mui/x-charts/RadarChart";
import { cn } from "@/lib/utils";

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

const CURRENT_SERIES_ID = "current-profile";
const PREVIOUS_SERIES_ID = "previous-profile";

function scoresToData(scores: SalesProfileScores): number[] {
  return [
    scores.assertivite,
    scores.ecouteActive,
    scores.capitalSympathie,
    scores.argumentation,
    scores.objections,
    scores.nextSteps,
  ];
}

export function SalesProfileRadar({
  scores,
  previousScores = null,
  height = 340,
}: {
  scores: SalesProfileScores;
  previousScores?: SalesProfileScores | null;
  height?: number;
}) {
  const series = [
    {
      id: CURRENT_SERIES_ID,
      label: "Profil actuel",
      data: scoresToData(scores),
      fillArea: true,
      color: "#8b5cf6",
    },
    ...(previousScores
      ? [
          {
            id: PREVIOUS_SERIES_ID,
            label: "Profil précédent",
            data: scoresToData(previousScores),
            fillArea: false,
            hideMark: true,
            color: "#94a3b8",
          },
        ]
      : []),
  ];

  return (
    <div className="w-full space-y-3">
      <RadarChart
        height={height}
        series={series}
        radar={{
          metrics: METRICS.map((name) => ({ name, min: 0, max: 100 })),
        }}
        shape="circular"
        divisions={4}
        hideLegend
        margin={{ top: 20, right: 32, bottom: 24, left: 32 }}
        sx={
          previousScores
            ? {
                [`& [data-series='${PREVIOUS_SERIES_ID}'] path`]: {
                  strokeDasharray: "6 4",
                  strokeWidth: 2,
                },
              }
            : undefined
        }
      />
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-600 dark:text-neutral-400">
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-8 rounded-full bg-violet-500"
            aria-hidden
          />
          Profil actuel
        </span>
        {previousScores ? (
          <span className="inline-flex items-center gap-2">
            <span
              className={cn(
                "inline-block h-0 w-8 border-t-2 border-dashed border-neutral-400",
              )}
              aria-hidden
            />
            Profil précédent
          </span>
        ) : null}
      </div>
    </div>
  );
}
