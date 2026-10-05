"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { rememberStatsWindow } from "@/lib/remember-stats-window";
import { statsWindowShortLabel } from "@/lib/stats-window-labels";
import { cn } from "@/lib/utils";
import {
  MIN_RDV_FOR_STATS,
  STATS_WINDOW_DAYS_OPTIONS,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";

/**
 * Le sélecteur de période de la maquette du 11 septembre : trois boutons,
 * 30 jours, 90 jours, 12 mois, toujours visibles.
 *
 * Il n'était affiché qu'à partir de cinq rendez-vous par période, si bien
 * qu'un compte jeune ne le voyait jamais. Toute période se choisit désormais ;
 * quand celle qui est affichée compte peu de rendez-vous, une pastille « peu
 * de données » le dit, comme la maquette le fait pour le classement.
 *
 * Le choix est écrit dans l'adresse et dans un cookie : il s'applique ainsi à
 * toutes les pages du manager, et pas seulement à celle où il a été fait.
 */
export function DashboardStatsPeriodSelect(props: {
  value: StatsWindowDays;
  /** Périodes qui comptent moins de rendez-vous que le seuil. */
  disabledDays?: StatsWindowDays[];
}) {
  const lowData = new Set(props.disabledDays ?? []);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function choose(days: StatsWindowDays) {
    if (days === props.value) return;
    rememberStatsWindow(days);
    const next = new URLSearchParams(searchParams.toString());
    next.set("jours", String(days));
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {lowData.has(props.value) ? (
        <span
          className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11.5px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
          title={`Moins de ${MIN_RDV_FOR_STATS} rendez-vous analysés sur la période : les chiffres sont indicatifs.`}
        >
          peu de données
        </span>
      ) : null}
      <div
        role="group"
        aria-label="Période affichée"
        className={cn(
          "inline-flex rounded-lg border border-border bg-muted/40 p-0.5",
          pending && "opacity-70",
        )}
      >
        {STATS_WINDOW_DAYS_OPTIONS.map((days) => {
          const selected = days === props.value;
          return (
            <button
              key={days}
              type="button"
              aria-pressed={selected}
              disabled={pending}
              onClick={() => choose(days)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
                selected
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {statsWindowShortLabel(days)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
