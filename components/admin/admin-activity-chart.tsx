"use client";

import { BarChart } from "@mui/x-charts/BarChart";

type Props = {
  data: { date: string; count: number }[];
};

export function AdminActivityChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Utilisateurs actifs / jour (14j)
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Nombre d'utilisateurs uniques avec session active par jour
      </p>
      <div className="mt-4 h-[220px]">
        <BarChart
          xAxis={[
            {
              data: data.map((d) => d.date),
              scaleType: "band",
              tickLabelStyle: { fontSize: 10 },
            },
          ]}
          series={[
            {
              data: data.map((d) => d.count),
              color: "#6366f1",
              label: "DAU",
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
