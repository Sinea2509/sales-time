"use client";

import { CalendarDays } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { rememberStatsWindow } from "@/lib/remember-stats-window";
import {
  statsWindowRangeLabel,
  statsWindowShortLabel,
} from "@/lib/stats-window-labels";
import { setStatsWindowParams } from "@/lib/stats-window-params";
import { cn } from "@/lib/utils";
import { toAppTimeZoneDatetimeLocal } from "@/src/core/domain/app-time-zone";
import {
  MIN_RDV_FOR_STATS,
  parseStatsWindowRange,
  STATS_WINDOW_DAYS_OPTIONS,
  STATS_WINDOW_RANGE_MAX_DAYS,
  statsWindowFromRange,
  type StatsWindow,
  type StatsWindowDays,
  type StatsWindowRange,
} from "@/src/core/domain/dashboard-stats-window";

const segmentClass =
  "rounded-md px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none";

/** « 2026-10-05 » : la date du jour dans le fuseau de l'application. */
function todayInAppTimeZone(): string {
  return toAppTimeZoneDatetimeLocal(new Date()).slice(0, 10);
}

function shiftDays(value: string, days: number): string {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Les raccourcis du calendrier : les périodes qu'un manager évalue le plus souvent. */
function shortcuts(
  today: string,
): Array<{ label: string; range: StatsWindowRange }> {
  const [y, m] = today.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const firstOfMonth = `${y}-${pad(m)}-01`;
  const lastOfPrevMonth = shiftDays(firstOfMonth, -1);
  const firstOfPrevMonth = `${lastOfPrevMonth.slice(0, 7)}-01`;
  const quarterStartMonth = Math.floor((m - 1) / 3) * 3 + 1;
  const firstOfQuarter = `${y}-${pad(quarterStartMonth)}-01`;
  const lastOfPrevQuarter = shiftDays(firstOfQuarter, -1);
  const [py, pm] = lastOfPrevQuarter.split("-").map(Number);
  const firstOfPrevQuarter = `${py}-${pad(Math.floor((pm - 1) / 3) * 3 + 1)}-01`;
  return [
    { label: "Ce mois-ci", range: { from: firstOfMonth, to: today } },
    {
      label: "Le mois dernier",
      range: { from: firstOfPrevMonth, to: lastOfPrevMonth },
    },
    {
      label: "Le trimestre dernier",
      range: { from: firstOfPrevQuarter, to: lastOfPrevQuarter },
    },
    {
      label: "Depuis le 1er janvier",
      range: { from: `${y}-01-01`, to: today },
    },
  ];
}

/**
 * Le sélecteur de période de la maquette du 11 septembre : trois boutons,
 * 30 jours, 90 jours, 12 mois, toujours visibles, et un quatrième qui ouvre un
 * petit calendrier pour choisir librement la période évaluée, du … au ….
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
  /** La période choisie au calendrier, quand c'en est une. */
  range?: StatsWindowRange | null;
  /** Périodes qui comptent moins de rendez-vous que le seuil. */
  disabledDays?: StatsWindowDays[];
}) {
  const range = props.range ?? null;
  const lowData = new Set(props.disabledDays ?? []);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const today = todayInAppTimeZone();
  const [from, setFrom] = useState(
    range?.from ?? shiftDays(today, -(props.value - 1)),
  );
  const [to, setTo] = useState(range?.to ?? today);
  const draft = parseStatsWindowRange(from, to);

  function go(window: StatsWindow) {
    rememberStatsWindow(window);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("jours");
    next.delete("du");
    next.delete("au");
    setStatsWindowParams(next, window);
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`);
    });
  }

  function choose(days: StatsWindowDays) {
    if (!range && days === props.value) return;
    go({ days, range: null });
  }

  function applyRange(chosen: StatsWindowRange | null) {
    if (!chosen) return;
    setOpen(false);
    go(statsWindowFromRange(chosen));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!range && lowData.has(props.value) ? (
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
          "inline-flex flex-wrap rounded-lg border border-border bg-muted/40 p-0.5",
          pending && "opacity-70",
        )}
      >
        {STATS_WINDOW_DAYS_OPTIONS.map((days) => {
          const selected = !range && days === props.value;
          return (
            <button
              key={days}
              type="button"
              aria-pressed={selected}
              disabled={pending}
              onClick={() => choose(days)}
              className={cn(
                segmentClass,
                selected
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {statsWindowShortLabel(days)}
            </button>
          );
        })}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            disabled={pending}
            aria-pressed={range != null}
            aria-label={
              range
                ? `Période choisie : ${statsWindowRangeLabel(range)}. Changer les dates`
                : "Choisir les dates de la période"
            }
            className={cn(
              segmentClass,
              "inline-flex items-center gap-1.5",
              range
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            {range ? statsWindowRangeLabel(range) : "Dates"}
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-80">
            <p className="text-[13px] font-semibold">Choisir la période</p>
            <p className="text-muted-foreground mt-0.5 text-[12px] leading-relaxed">
              Les chiffres se comparent à la période de même durée qui la
              précède.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {shortcuts(today).map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => applyRange(s.range)}
                  className="rounded-md border border-border px-2 py-1.5 text-left text-[12px] font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-[12px] font-medium">
                Du
                <input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-9 rounded-md border border-border bg-background px-2 text-[13px]"
                />
              </label>
              <label className="grid gap-1 text-[12px] font-medium">
                Au
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-9 rounded-md border border-border bg-background px-2 text-[13px]"
                />
              </label>
            </div>
            {!draft && from && to ? (
              <p className="mt-2 text-[12px] text-red-700 dark:text-red-400">
                Choisissez deux dates, sur{" "}
                {Math.floor(STATS_WINDOW_RANGE_MAX_DAYS / 366)} ans au plus.
              </p>
            ) : null}
            <button
              type="button"
              disabled={!draft || pending}
              onClick={() => applyRange(draft)}
              className="bg-brand mt-3 w-full rounded-md px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              Afficher cette période
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
