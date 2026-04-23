import {
  Banknote,
  Box,
  Clock,
  Sparkles,
  Wallet,
} from "lucide-react";
import { ESTIMATED_TAM_EUR_PER_RDV } from "@/src/core/domain/dashboard-estimates";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { KpiTile } from "@/components/molecules/kpi-tile";
import {
  TrendPercentPill,
  TrendPointsPill,
} from "@/components/molecules/trend-pill";
import { cn } from "@/lib/utils";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function DashboardKpiCards({
  home,
  showGlobalNote = true,
}: {
  home: OrgDashboardHome;
  showGlobalNote?: boolean;
}) {
  const heroIsDuration = home.avgDurationMin != null;
  const heroTrend = heroIsDuration
    ? home.avgDurationTrendPercent
    : home.tamTrendPercent;
  const heroTrendMode: "up-good" | "down-good" = heroIsDuration
    ? "down-good"
    : "up-good";

  const HeroIcon = heroIsDuration ? Clock : Banknote;
  const heroLabel = heroIsDuration ? "Temps moyen RDV" : "TAM cumulé";

  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        showGlobalNote ? "xl:grid-cols-4" : "xl:grid-cols-3",
      )}
    >
      <KpiTile
        icon={HeroIcon}
        label={heroLabel}
        trend={
          <TrendPercentPill percent={heroTrend} mode={heroTrendMode} />
        }
        footer={
          heroIsDuration ? (
            <>
              TAM estimé :{" "}
              <span className="text-foreground font-medium">
                {eurFormatter.format(home.tamCumuleEur)}
              </span>
            </>
          ) : (
            <>
              {eurFormatter.format(ESTIMATED_TAM_EUR_PER_RDV)} / RDV ·{" "}
              {home.statsWindowDays} jours
            </>
          )
        }
      >
        {heroIsDuration
          ? formatDurationHoursMinutes(home.avgDurationMin!)
          : eurFormatter.format(home.tamCumuleEur)}
      </KpiTile>

      <KpiTile
        icon={Box}
        label="Nb de rdvs"
        trend={
          <TrendPercentPill percent={home.nbRdvsTrendPercent} mode="up-good" />
        }
      >
        {home.nbRdvs}
      </KpiTile>

      <KpiTile
        icon={Wallet}
        label="TUC optimisé"
        trend={<TrendPointsPill points={home.tucTrendPoints} />}
      >
        {home.tucOptimisePercent === null ? "—" : `${home.tucOptimisePercent}%`}
      </KpiTile>

      {showGlobalNote ? (
        <KpiTile
          icon={Sparkles}
          label="Note globale"
          trend={<TrendPointsPill points={home.noteGlobaleTrendPoints} />}
        >
          {home.noteGlobaleOn5 === null ? (
            "—"
          ) : (
            <>
              {home.noteGlobaleOn5.toFixed(1)}
              <span className="text-muted-foreground ml-1 text-lg font-medium dark:text-zinc-400">
                / 5
              </span>
            </>
          )}
        </KpiTile>
      ) : null}
    </div>
  );
}
