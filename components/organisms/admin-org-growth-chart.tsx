"use client";

import { BarChart } from "@mui/x-charts/BarChart";

type Props = {
  data: { month: string; count: number }[];
};

export function AdminOrgGrowthChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Nouvelles organisations / mois
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Croissance du nombre d'organisations sur les 6 derniers mois
      </p>
      <div className="mt-4 h-[220px]">
        <BarChart
          xAxis={[
            {
              data: data.map((d) => d.month),
              scaleType: "band",
              tickLabelStyle: { fontSize: 10 },
            },
          ]}
          series={[
            {
              data: data.map((d) => d.count),
              color: "#8b5cf6",
              label: "Orgs",
            },
          ]}
          height={220}
          margin={{ top: 20, right: 10, bottom: 30, left: 40 }}
          hideLegend
        />
      </div>
    </div>
  );
}
