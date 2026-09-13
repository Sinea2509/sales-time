"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { ChartTheme } from "@/components/atoms/chart-theme";

type Props = {
  data: { month: string; count: number }[];
};

export function AdminOrgGrowthChart({ data }: Props) {
  return (
    <div className="border-border bg-card rounded-xl border p-5 shadow-sm">
      <h3 className="text-foreground text-sm font-semibold">
        Nouvelles organisations / mois
      </h3>
      <p className="text-muted-foreground text-xs">
        Croissance du nombre d&apos;organisations sur les 6 derniers mois
      </p>
      <div className="mt-4 h-[220px]">
        <ChartTheme>
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
        </ChartTheme>
      </div>
    </div>
  );
}
