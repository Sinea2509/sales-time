"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  areAllStatsWindowsDisabled,
  MIN_RDV_FOR_STATS,
  STATS_WINDOW_DAYS_OPTIONS,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import {
  formatStatsRangeDay,
  statsRangeLabel,
  type StatsRangeInput,
} from "@/src/core/domain/stats-range";

const LABELS: Record<number, string> = {
  30: "30 jours",
  60: "60 jours",
  90: "90 jours",
};

const CUSTOM = "custom";

/**
 * Le sélecteur de période : trois fenêtres glissantes, et des dates libres
 * choisies au calendrier.
 *
 * Une fenêtre s'écrit `jours=30` dans l'adresse, une période libre
 * `du=2026-08-01&au=2026-08-31`. Les deux ne cohabitent pas : choisir l'une
 * efface l'autre. Une fenêtre sans assez de rendez-vous est grisée, avec le
 * fait qui la grise ; les dates libres, elles, restent toujours ouvertes, le
 * lecteur qui les choisit sait ce qu'il regarde.
 */
export function DashboardStatsPeriodSelect(props: {
  value: StatsWindowDays;
  /** Fenêtres sans assez de RDV : options grisées dans le sélecteur. */
  disabledDays?: StatsWindowDays[];
  /** La période libre en vigueur, quand l'adresse en porte une. */
  range?: StatsRangeInput | null;
}) {
  const disabledDays = props.disabledDays ?? [];
  const disabledSet = new Set(disabledDays);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [custom, setCustom] = useState(props.range != null);
  const today = formatStatsRangeDay(new Date());
  const [from, setFrom] = useState(props.range?.from ?? "");
  const [to, setTo] = useState(props.range?.to ?? today);

  const navigate = (next: URLSearchParams) => {
    startTransition(() => {
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  };

  const choosePreset = (jours: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("jours", jours);
    next.delete("du");
    next.delete("au");
    navigate(next);
  };

  const applyRange = () => {
    if (!from || !to || to < from) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("jours");
    next.set("du", from);
    next.set("au", to);
    navigate(next);
  };

  const allDisabled = areAllStatsWindowsDisabled(disabledDays);
  const selectValue = custom || props.range ? CUSTOM : String(props.value);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="relative inline-flex items-center text-sm whitespace-nowrap text-muted-foreground">
        <select
          aria-label="Période des statistiques"
          className="h-8 appearance-none rounded-md bg-transparent pr-5 pl-1 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
          value={selectValue}
          disabled={pending}
          onChange={(e) => {
            if (e.target.value === CUSTOM) {
              setCustom(true);
              return;
            }
            setCustom(false);
            choosePreset(e.target.value);
          }}
        >
          {STATS_WINDOW_DAYS_OPTIONS.map((d) => (
            <option key={d} value={String(d)} disabled={disabledSet.has(d)}>
              {LABELS[d] ?? `${d} jours`}
              {disabledSet.has(d) ? ` (moins de ${MIN_RDV_FOR_STATS} RDV)` : ""}
            </option>
          ))}
          <option value={CUSTOM}>
            {props.range ? statsRangeLabel(props.range) : "Dates libres…"}
          </option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-0 size-4 text-muted-foreground" />
      </div>

      {allDisabled && !custom ? (
        <p className="text-muted-foreground max-w-[17rem] text-right text-xs text-pretty">
          Les fenêtres glissantes s&apos;ouvrent à partir de {MIN_RDV_FOR_STATS}{" "}
          RDV enregistrés. Les dates libres restent possibles.
        </p>
      ) : null}

      {custom ? (
        <form
          className="flex flex-wrap items-center justify-end gap-1.5 text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            applyRange();
          }}
        >
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">du</span>
            <input
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => setFrom(e.target.value)}
              className="border-border bg-card h-8 rounded-md border px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="Premier jour de la période"
              required
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">au</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="border-border bg-card h-8 rounded-md border px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="Dernier jour de la période"
              required
            />
          </label>
          <button
            type="submit"
            disabled={pending || !from || !to || to < from}
            className="bg-brand text-brand-foreground hover:bg-brand-hover h-8 rounded-md px-3 text-xs font-semibold disabled:opacity-50"
          >
            Appliquer
          </button>
        </form>
      ) : null}
    </div>
  );
}
