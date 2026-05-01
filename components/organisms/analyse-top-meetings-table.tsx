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
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import {
  meetingEtapeLabel,
  meetingEtapePillClass,
} from "@/lib/meeting-etape-pill";
import { prospectInitials } from "@/lib/prospect-initials";
import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import { cn } from "@/lib/utils";

export type AnalyseTopMeetingRow = {
  id: string;
  prospectName: string;
  meetingAt: string;
  salesScore: number;
  outcome: MeetingOutcome;
  /** Minutes de TAM / RDV (paramètres org, identique pour chaque ligne). */
  tamMinutesPerRdv: number;
};

const OPPORTUNITY_OPTIONS: Array<{
  value: MeetingOutcome | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "Toutes" },
  { value: "OTHER", label: "Qualification" },
  { value: "FOLLOW_UP", label: "Decouverte" },
  { value: "WON", label: "Proposition" },
  { value: "LOST", label: "Negociation" },
  { value: "NO_SHOW", label: "Absent" },
];

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function AnalyseTopMeetingsTable({
  rows,
}: {
  rows: AnalyseTopMeetingRow[];
}) {
  const [opportunityFilter, setOpportunityFilter] = useState<
    MeetingOutcome | "ALL"
  >("ALL");

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (opportunityFilter !== "ALL" && r.outcome !== opportunityFilter)
          return false;
        return true;
      }),
    [rows, opportunityFilter],
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
            <DataTableHead className="px-3 py-2.5">TAM</DataTableHead>
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
              <td
                className="text-muted-foreground px-3 py-8 text-center"
                colSpan={6}
              >
                Aucun resultat avec ces filtres.
              </td>
            </tr>
          ) : (
            filtered.map((m) => (
              <tr
                key={m.id}
                className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40"
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-neutral-100 text-neutral-700 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold dark:bg-neutral-800 dark:text-neutral-200">
                      {prospectInitials(m.prospectName)}
                    </div>
                    <span className="truncate font-semibold">
                      {m.prospectName}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {formatDurationHoursMinutes(m.tamMinutesPerRdv)}
                </td>
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
                <td className="px-3 py-2.5 font-semibold tabular-nums">
                  {m.salesScore}
                </td>
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
