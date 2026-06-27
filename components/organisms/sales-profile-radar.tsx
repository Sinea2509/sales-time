"use client";

import { useEffect, useState } from "react";
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

const METRIC_LABELS = [
  "Assertivité",
  "Écoute",
  "Sympathie",
  "Argument.",
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
  height,
}: {
  scores: SalesProfileScores;
  previousScores?: SalesProfileScores | null;
  height?: number;
}) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const chartHeight = height ?? (isCompact ? 300 : 340);
  const margin = isCompact
    ? { top: 32, right: 52, bottom: 32, left: 52 }
    : { top: 28, right: 44, bottom: 28, left: 44 };
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
        height={chartHeight}
        series={series}
        radar={{
          metrics: METRIC_LABELS.map((name) => ({ name, min: 0, max: 100 })),
        }}
        shape="circular"
        divisions={4}
        hideLegend
        margin={margin}
        sx={{
          "& .MuiChartsAxis-tickLabel": {
            fontSize: isCompact ? 10 : 11,
          },
          ...(previousScores
            ? {
                [`& [data-series='${PREVIOUS_SERIES_ID}'] path`]: {
                  strokeDasharray: "6 4",
                  strokeWidth: 2,
                },
              }
            : {}),
        }}
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
