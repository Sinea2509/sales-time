import { TrendingDown, TrendingUp } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { isStatsWindowEligibleForTrends } from "@/src/core/domain/dashboard-stats-window";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import { plurielFr } from "@/lib/pluriel-fr";
import { cn } from "@/lib/utils";

const basePill =
  "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums";

export type TrendDirectionMode = "up-good" | "down-good" | "neutral";

function deltaDisplayMagnitude(delta: number): number {
  const absVal = Math.abs(delta);
  return Math.abs(absVal % 1) < 0.001
    ? Math.round(absVal)
    : Math.round(absVal * 10) / 10;
}

const kpiVsPreviousVariants = cva(basePill, {
  variants: {
    intent: {
      good: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-100",
      bad: "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:border-rose-500/35 dark:bg-rose-500/15 dark:text-rose-100",
      neutral:
        "border-border bg-muted text-muted-foreground dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    },
  },
  defaultVariants: { intent: "neutral" },
});

function resolveIntent(
  delta: number,
  mode: TrendDirectionMode,
): NonNullable<VariantProps<typeof kpiVsPreviousVariants>["intent"]> {
  if (delta === 0 || mode === "neutral") return "neutral";
  const good = mode === "up-good" ? delta > 0 : delta < 0;
  const bad = mode === "up-good" ? delta < 0 : delta > 0;
  if (good) return "good";
  if (bad) return "bad";
  return "neutral";
}

export type KpiVsPreviousBadgeProps = {
  /** Variation brute (positif = hausse). Bon/mauvais selon `mode`. */
  delta: number | null;
  mode: TrendDirectionMode;
  /**
   * `percent` = variation relative (suffixe %).
   * `points` = écart brut entre deux valeurs de même échelle (suffixe pt/pts).
   */
  deltaDisplay?: "percent" | "points";
  /**
   * Ce que « point » désigne sur cette carte, pour l'infobulle : « points de
   * pourcentage du TUC », « points sur l'échelle de 5 ». Un point ne veut rien
   * dire seul, et deux cartes voisines peuvent en compter de différents.
   */
  pointsScaleLabel?: string;
  /** Masque le badge si l'échantillon courant est trop faible. */
  minSampleCount?: number;
  currentSampleCount?: number;
  /** Fenêtre stats active, affiche « vs N j. préc. » sur le badge. */
  statsWindowDays?: StatsWindowDays;
  className?: string;
};

function statsWindowReferenceLabel(days: StatsWindowDays): string {
  return `vs ${days} j. préc.`;
}

/**
 * Badge « vs période précédente » : valeur absolue sans signe, la couleur et
 * l'icône disant si la variation est favorable ou non.
 *
 * Le badge disparaît quand la variation n'existe pas (`delta` nul) ou quand
 * l'échantillon est trop mince pour qu'une tendance veuille dire quelque chose.
 * Ne rien afficher est ici une information : mieux vaut une carte muette qu'une
 * carte qui affirme une progression tirée de trois rendez-vous.
 */
export function KpiVsPreviousBadge({
  delta,
  mode,
  deltaDisplay = "percent",
  pointsScaleLabel,
  minSampleCount = 0,
  currentSampleCount,
  statsWindowDays,
  className,
}: KpiVsPreviousBadgeProps) {
  if (delta === null || Number.isNaN(delta)) return null;
  if (
    minSampleCount > 0 &&
    (currentSampleCount == null ||
      !isStatsWindowEligibleForTrends(currentSampleCount) ||
      currentSampleCount < minSampleCount)
  ) {
    return null;
  }
  const displayMagnitude = deltaDisplayMagnitude(delta);
  if (displayMagnitude === 0) return null;
  const intent = resolveIntent(delta, mode);
  const Icon = delta > 0 ? TrendingUp : TrendingDown;
  const textRaw =
    Math.abs(displayMagnitude % 1) < 0.001
      ? String(Math.round(displayMagnitude))
      : String(displayMagnitude);
  const textFr = textRaw.replace(".", ",");
  const isPp = deltaDisplay === "points";
  // Le pluriel suit le nombre écrit à côté du mot, arrondi compris : « 1 pt »,
  // « 1,5 pt », « 2 pts ».
  const uniteCourte = plurielFr(displayMagnitude, "pt", "pts");
  const uniteLongue = plurielFr(displayMagnitude, "point");
  const referenceLabel =
    statsWindowDays != null ? statsWindowReferenceLabel(statsWindowDays) : null;
  const periodHint = isPp
    ? `Écart vs les ${statsWindowDays ?? "N"} jours précédents, en ${pointsScaleLabel ?? "points"}`
    : `Variation vs les ${statsWindowDays ?? "N"} jours précédents (même durée que la sélection)`;
  const sens = delta > 0 ? "hausse" : "baisse";
  const ariaLabel = isPp
    ? `${periodHint} : ${sens} de ${textFr} ${uniteLongue}.`
    : `${periodHint} : ${sens} de ${textFr} %.`;
  return (
    <span
      className={cn(
        kpiVsPreviousVariants({ intent }),
        "flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-1",
        className,
      )}
      title={periodHint}
      aria-label={ariaLabel}
    >
      <span className="inline-flex items-center gap-0.5">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="tabular-nums" aria-hidden>
          {textFr}
          {/* Espace insécable : le signe ne part jamais seul à la ligne. */}
          {isPp ? ` ${uniteCourte}` : " %"}
        </span>
      </span>
      {referenceLabel ? (
        <span className="text-[10px] font-normal opacity-80">
          {referenceLabel}
        </span>
      ) : null}
    </span>
  );
}
