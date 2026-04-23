"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableHead } from "@/components/molecules/data-table-head";
import { buttonVariants } from "@/components/ui/button";
import { meetingEtapeLabel, meetingEtapePillClass } from "@/lib/meeting-etape-pill";
import { prospectInitials } from "@/lib/prospect-initials";
import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import { cn } from "@/lib/utils";

export type AnalyseTopMeetingRow = {
  id: string;
  prospectName: string;
  meetingAt: string;
  salesScore: number;
  outcome: MeetingOutcome;
  potentialEur: number;
};

type PotentialBucket = "ALL" | "LT_10K" | "10K_50K" | "50K_100K" | "GT_100K";

const POTENTIAL_OPTIONS: Array<{ value: PotentialBucket; label: string }> = [
  { value: "ALL", label: "Tous" },
  { value: "LT_10K", label: "< 10 000 €" },
  { value: "10K_50K", label: "10 000 - 50 000 €" },
  { value: "50K_100K", label: "50 000 - 100 000 €" },
  { value: "GT_100K", label: "> 100 000 €" },
];

const OPPORTUNITY_OPTIONS: Array<{ value: MeetingOutcome | "ALL"; label: string }> = [
  { value: "ALL", label: "Toutes" },
  { value: "OTHER", label: "Qualification" },
  { value: "FOLLOW_UP", label: "Decouverte" },
  { value: "WON", label: "Proposition" },
  { value: "LOST", label: "Negociation" },
  { value: "NO_SHOW", label: "Absent" },
];

const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function matchesPotential(value: number, bucket: PotentialBucket): boolean {
  switch (bucket) {
    case "ALL":
      return true;
    case "LT_10K":
      return value < 10_000;
    case "10K_50K":
      return value >= 10_000 && value < 50_000;
    case "50K_100K":
      return value >= 50_000 && value < 100_000;
    case "GT_100K":
      return value >= 100_000;
  }
}

export function AnalyseTopMeetingsTable({ rows }: { rows: AnalyseTopMeetingRow[] }) {
  const [potentialFilter, setPotentialFilter] = useState<PotentialBucket>("ALL");
  const [opportunityFilter, setOpportunityFilter] = useState<MeetingOutcome | "ALL">(
    "ALL",
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (!matchesPotential(r.potentialEur, potentialFilter)) return false;
        if (opportunityFilter !== "ALL" && r.outcome !== opportunityFilter) return false;
        return true;
      }),
    [rows, potentialFilter, opportunityFilter],
  );

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun rendez-vous analyse pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/50">
            <DataTableHead className="px-3 py-2.5">Prospect</DataTableHead>
            <DataTableHead className="px-3 py-2.5">
              <div className="flex items-center gap-1">
                <span>Potentiel</span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "size-6 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                    )}
                    aria-label="Filtrer potentiel"
                  >
                    <Filter className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={potentialFilter}
                      onValueChange={(v) => setPotentialFilter(v as PotentialBucket)}
                    >
                      {POTENTIAL_OPTIONS.map((o) => (
                        <DropdownMenuRadioItem key={o.value} value={o.value}>
                          {o.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DataTableHead>
            <DataTableHead className="px-3 py-2.5">
              <div className="flex items-center gap-1">
                <span>Opportunity</span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "size-6 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                    )}
                    aria-label="Filtrer opportunity"
                  >
                    <Filter className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={opportunityFilter}
                      onValueChange={(v) =>
                        setOpportunityFilter(v as MeetingOutcome | "ALL")
                      }
                    >
                      {OPPORTUNITY_OPTIONS.map((o) => (
                        <DropdownMenuRadioItem key={o.value} value={o.value}>
                          {o.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DataTableHead>
            <DataTableHead className="px-3 py-2.5">Date</DataTableHead>
            <DataTableHead className="px-3 py-2.5">Score</DataTableHead>
            <DataTableHead className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {filtered.length === 0 ? (
            <tr>
              <td className="text-muted-foreground px-3 py-8 text-center" colSpan={6}>
                Aucun resultat avec ces filtres.
              </td>
            </tr>
          ) : (
            filtered.map((m) => (
              <tr key={m.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-neutral-100 text-neutral-700 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold dark:bg-neutral-800 dark:text-neutral-200">
                      {prospectInitials(m.prospectName)}
                    </div>
                    <span className="truncate font-semibold">{m.prospectName}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 tabular-nums">{eurFormatter.format(m.potentialEur)}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      meetingEtapePillClass(m.outcome),
                    )}
                  >
                    {meetingEtapeLabel(m.outcome)}
                  </span>
                </td>
                <td className="text-muted-foreground px-3 py-2.5 tabular-nums">
                  {dateShort.format(new Date(m.meetingAt))}
                </td>
                <td className="px-3 py-2.5 font-semibold tabular-nums">{m.salesScore}</td>
                <td className="px-3 py-2.5 text-right">
                  <Link
                    href={`/company/rendez-vous/${m.id}`}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "text-muted-foreground hover:text-foreground",
                    )}
                    aria-label={`Ouvrir ${m.prospectName}`}
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

