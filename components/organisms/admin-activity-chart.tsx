"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { ChartTheme } from "@/components/atoms/chart-theme";

type Props = {
  data: { date: string; count: number }[];
};

export function AdminActivityChart({ data }: Props) {
  return (
    <div className="border-border bg-card rounded-xl border p-5 shadow-sm">
      <h3 className="text-foreground text-sm font-semibold">
        Utilisateurs actifs / jour (14j)
      </h3>
      <p className="text-muted-foreground text-xs">
        Nombre d&apos;utilisateurs uniques avec session active par jour
      </p>
      <div className="mt-4 h-[220px]">
        <ChartTheme>
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
        </ChartTheme>
      </div>
    </div>
  );
}
