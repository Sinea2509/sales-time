"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
} from "lucide-react";
import { BrandCtaLink } from "@/components/molecules/brand-cta-link";
import { DataTableHead } from "@/components/molecules/data-table-head";
import { RendezVousMeetingRowActions } from "@/components/molecules/rendez-vous-meeting-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import {
  meetingEtapeLabel,
  meetingEtapePillClass,
} from "@/lib/meeting-etape-pill";
import { meetingOutcomeLabel } from "@/lib/meeting-outcome-labels";
import { prospectInitials } from "@/lib/prospect-initials";
import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import { cn } from "@/lib/utils";

export type RendezVousMeetingRow = {
  id: string;
  prospectName: string;
  meetingAt: string;
  outcome: MeetingOutcome;
  durationMin: number | null;
  sellerEmail: string | null;
  salesScore: number | null;
  tamMinutesPerRdv: number;
};

const ETAPE_FILTER_OPTIONS: ReadonlyArray<{
  value: MeetingOutcome | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "Toutes les étapes" },
  { value: "OTHER", label: "Qualification" },
  { value: "FOLLOW_UP", label: "Découverte" },
  { value: "WON", label: "Proposition" },
  { value: "LOST", label: "Négociation" },
  { value: "NO_SHOW", label: "Absent" },
];

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadMeetingsCsv(meetings: RendezVousMeetingRow[]) {
  const headers = [
    "Prospect",
    "TAM (min / RDV)",
    "Date du rendez-vous",
    "Étape",
    "SalesScore",
    "Commercial",
    "Durée (min)",
  ];
  const lines = [
    headers.join(","),
    ...meetings.map((m) =>
      [
        escapeCsvCell(m.prospectName),
        String(m.tamMinutesPerRdv),
        escapeCsvCell(m.meetingAt),
        escapeCsvCell(meetingOutcomeLabel(m.outcome)),
        m.salesScore != null ? String(m.salesScore) : "",
        escapeCsvCell(m.sellerEmail ?? ""),
        m.durationMin != null ? String(m.durationMin) : "",
      ].join(","),
    ),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rendez-vous-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 10;
const MAX_PAGE_BUTTONS = 4;

function paginationWindow(
  currentPage: number,
  totalPages: number,
): number[] {
  if (totalPages <= MAX_PAGE_BUTTONS) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  let start = Math.max(1, currentPage - 1);
  let end = start + MAX_PAGE_BUTTONS - 1;
  if (end > totalPages) {
    end = totalPages;
    start = end - MAX_PAGE_BUTTONS + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function RendezVousMeetingsShell({
  meetings,
  showSellerColumn = false,
}: {
  meetings: RendezVousMeetingRow[];
  /** When true (org admin), show which seller owns the meeting. */
  showSellerColumn?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [etapeFilter, setEtapeFilter] = useState<MeetingOutcome | "ALL">(
    "ALL",
  );
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meetings.filter((m) => {
      if (q && !m.prospectName.toLowerCase().includes(q)) return false;
      if (etapeFilter !== "ALL" && m.outcome !== etapeFilter) return false;
      return true;
    });
  }, [meetings, query, etapeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const currentPage = Math.min(Math.max(1, page), totalPages);

  const setQueryAndResetPage = useCallback((value: string) => {
    setQuery(value);
    setPage(1);
  }, []);

  const setEtapeFilterAndResetPage = useCallback(
    (value: MeetingOutcome | "ALL") => {
      setEtapeFilter(value);
      setPage(1);
    },
    [],
  );
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + PAGE_SIZE, filtered.length);
  const pageNumbers = paginationWindow(currentPage, totalPages);

  const pageIds = pageRows.map((m) => m.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    !allPageSelected && pageIds.some((id) => selectedIds.has(id));

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const togglePage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) pageIds.forEach((id) => next.add(id));
      else pageIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const filterSelectClass =
    "h-10 rounded-lg border border-neutral-200 bg-white py-1 pl-3 pr-10 text-sm shadow-none outline-none focus-visible:border-neutral-200 focus-visible:ring-0 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:border-neutral-800";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              aria-label="Rechercher un prospect"
              placeholder="Rechercher un prospect…"
              value={query}
              onChange={(e) => setQueryAndResetPage(e.target.value)}
              className="h-10 rounded-xl border-neutral-200 bg-white pl-9 shadow-none dark:border-neutral-800 dark:bg-neutral-950"
            />
          </div>
          <label className="sr-only" htmlFor="filter-etape">
            Étape
          </label>
          <select
            id="filter-etape"
            value={etapeFilter}
            onChange={(e) =>
              setEtapeFilterAndResetPage(
                e.target.value as MeetingOutcome | "ALL",
              )
            }
            className={filterSelectClass}
          >
            {ETAPE_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-md border-brand/25 bg-brand/10 text-brand-hover hover:bg-brand/15 dark:text-brand-muted"
            onClick={() => downloadMeetingsCsv(filtered)}
          >
            <Download className="size-4" />
            Exporter
          </Button>
          <BrandCtaLink
            href="/company/rendez-vous/nouveau"
            variant="primary"
            className="h-10 gap-1.5 rounded-md"
          >
            <Plus className="size-4" />
            Nouveau rendez-vous
          </BrandCtaLink>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/50">
                <th className="w-12 px-4 py-3.5">
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner sur cette page"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected;
                    }}
                    onChange={(e) => togglePage(e.target.checked)}
                    className="size-4 cursor-pointer rounded border border-neutral-300 accent-brand dark:border-neutral-600"
                  />
                </th>
                <DataTableHead className="px-4 py-3.5">Prospect</DataTableHead>
                {showSellerColumn ? (
                  <DataTableHead className="hidden px-4 py-3.5 md:table-cell">
                    Commercial
                  </DataTableHead>
                ) : null}
                <DataTableHead className="hidden px-4 py-3.5 sm:table-cell">
                  TAM
                </DataTableHead>
                <DataTableHead className="px-4 py-3.5">Date du RDV</DataTableHead>
                <DataTableHead className="px-4 py-3.5">Étape</DataTableHead>
                <DataTableHead className="hidden px-4 py-3.5 md:table-cell">
                  SalesScore
                </DataTableHead>
                <DataTableHead className="w-20 px-4 py-3.5 text-right">
                  Actions
                </DataTableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={showSellerColumn ? 8 : 7}
                    className="text-muted-foreground px-4 py-12 text-center"
                  >
                    {meetings.length === 0
                      ? "Aucun rendez-vous pour cette organisation."
                      : "Aucun résultat avec ces filtres."}
                  </td>
                </tr>
              ) : (
                pageRows.map((m) => {
                  const checked = selectedIds.has(m.id);
                  return (
                    <tr
                      key={m.id}
                      data-state={checked ? "selected" : undefined}
                      className="hover:bg-neutral-50/80 data-[state=selected]:bg-brand/5 dark:hover:bg-neutral-900/40"
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <input
                          type="checkbox"
                          aria-label={`Sélectionner ${m.prospectName}`}
                          checked={checked}
                          onChange={(e) =>
                            toggleRow(m.id, e.target.checked)
                          }
                          className="size-4 cursor-pointer rounded border border-neutral-300 accent-brand dark:border-neutral-600"
                        />
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="bg-neutral-100 text-neutral-700 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold dark:bg-neutral-800 dark:text-neutral-200">
                            {prospectInitials(m.prospectName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-neutral-950 truncate font-semibold dark:text-neutral-50">
                              {m.prospectName}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              Entreprise
                            </p>
                          </div>
                        </div>
                      </td>
                      {showSellerColumn ? (
                        <td className="text-muted-foreground hidden max-w-[140px] truncate px-4 py-3.5 align-middle text-xs md:table-cell">
                          {m.sellerEmail ?? "—"}
                        </td>
                      ) : null}
                      <td className="text-muted-foreground hidden whitespace-nowrap px-4 py-3.5 align-middle tabular-nums sm:table-cell">
                        {formatDurationHoursMinutes(m.tamMinutesPerRdv)}
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap px-4 py-3.5 align-middle tabular-nums">
                        {dateShort.format(new Date(m.meetingAt))}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            meetingEtapePillClass(m.outcome),
                          )}
                        >
                          {meetingEtapeLabel(m.outcome)}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3.5 align-middle md:table-cell">
                        {m.salesScore != null ? (
                          <span className="text-base font-semibold tabular-nums text-neutral-950 dark:text-neutral-100">
                            {m.salesScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right align-middle">
                        <RendezVousMeetingRowActions
                          meetingId={m.id}
                          prospectName={m.prospectName}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
          <p className="text-muted-foreground text-sm">
            Affichage de <span className="text-foreground font-medium">{rangeStart}</span>{" "}
            à <span className="text-foreground font-medium">{rangeEnd}</span> sur{" "}
            <span className="text-foreground font-medium">{filtered.length}</span>{" "}
            entrée{filtered.length > 1 ? "s" : ""}
            {selectedIds.size > 0 ? (
              <span className="text-muted-foreground ml-2">
                · <span className="text-foreground font-medium">{selectedIds.size}</span>{" "}
                sélectionné{selectedIds.size > 1 ? "s" : ""}
              </span>
            ) : null}
          </p>
          <nav
            aria-label="Pagination"
            className="flex items-center gap-1"
          >
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Page précédente"
              className="text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-md border border-neutral-200 bg-white transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900 dark:disabled:hover:bg-neutral-950"
            >
              <ChevronLeft className="size-4" />
            </button>
            {pageNumbers.map((n) => {
              const isActive = n === currentPage;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-label={`Page ${n}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-md border text-sm font-medium tabular-nums transition-colors",
                    isActive
                      ? "border-brand bg-brand text-white hover:bg-brand-hover"
                      : "text-muted-foreground hover:text-foreground border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900",
                  )}
                >
                  {n}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Page suivante"
              className="text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-md border border-neutral-200 bg-white transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900 dark:disabled:hover:bg-neutral-950"
            >
              <ChevronRight className="size-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
