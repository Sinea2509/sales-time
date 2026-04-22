"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Download,
  Plus,
  Search,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { meetingOutcomeBadgeClass } from "@/lib/meeting-outcome-badge-styles";
import { meetingOutcomeLabel } from "@/lib/meeting-outcome-labels";
import { prospectInitials } from "@/lib/prospect-initials";
import type { MeetingOutcome } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

export type RendezVousMeetingRow = {
  id: string;
  prospectName: string;
  meetingAt: string;
  outcome: MeetingOutcome;
  durationMin: number | null;
  sellerEmail: string | null;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadMeetingsCsv(meetings: RendezVousMeetingRow[]) {
  const headers = [
    "Prospect",
    "Date du rendez-vous",
    "Résultat",
    "Commercial",
    "Durée (min)",
  ];
  const lines = [
    headers.join(","),
    ...meetings.map((m) =>
      [
        escapeCsvCell(m.prospectName),
        escapeCsvCell(m.meetingAt),
        escapeCsvCell(m.outcome),
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

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function RendezVousMeetingsShell({
  meetings,
}: {
  meetings: RendezVousMeetingRow[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meetings;
    return meetings.filter((m) => m.prospectName.toLowerCase().includes(q));
  }, [meetings, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            aria-label="Rechercher un prospect"
            placeholder="Rechercher un prospect…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-xl border-neutral-200 bg-white pl-9 shadow-none dark:border-neutral-800 dark:bg-neutral-950"
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-lg border-[#6C4DFF]/25 bg-[#6C4DFF]/10 text-[#5a3fd9] hover:bg-[#6C4DFF]/15 dark:text-[#c4b5fd]"
            onClick={() => downloadMeetingsCsv(filtered)}
          >
            <Download className="size-4" />
            Exporter
          </Button>
          <Link
            href="/dashboard/rendez-vous/nouveau"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-10 gap-1.5 rounded-lg border-0 bg-[#6C4DFF] px-4 text-white hover:bg-[#5a3fd9]",
            )}
          >
            <Plus className="size-4" />
            Nouveau rendez-vous
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/50">
                <th className="text-muted-foreground w-12 px-4 py-3.5" />
                <th className="text-muted-foreground px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase">
                  Client
                </th>
                <th className="text-muted-foreground hidden px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase md:table-cell">
                  Commercial
                </th>
                <th className="text-muted-foreground px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase">
                  Statut
                </th>
                <th className="text-muted-foreground hidden px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase lg:table-cell">
                  Date
                </th>
                <th className="text-muted-foreground w-12 px-4 py-3.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted-foreground px-4 py-12 text-center"
                  >
                    {meetings.length === 0
                      ? "Aucun rendez-vous pour cette organisation."
                      : "Aucun résultat pour cette recherche."}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40"
                  >
                    <td className="px-4 py-3.5 align-middle">
                      <span
                        className="border-neutral-300 bg-background inline-block size-4 rounded border dark:border-neutral-600"
                        aria-hidden
                      />
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="bg-neutral-100 text-neutral-700 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold dark:bg-neutral-800 dark:text-neutral-200">
                          {prospectInitials(m.prospectName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-neutral-950 truncate font-medium dark:text-neutral-50">
                            {m.prospectName}
                          </p>
                          <p className="text-muted-foreground truncate text-xs md:hidden">
                            {dateFmt.format(new Date(m.meetingAt))}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted-foreground hidden px-4 py-3.5 align-middle md:table-cell">
                      <span className="truncate">{m.sellerEmail ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          meetingOutcomeBadgeClass(m.outcome),
                        )}
                      >
                        {meetingOutcomeLabel(m.outcome)}
                      </span>
                    </td>
                    <td className="text-muted-foreground hidden whitespace-nowrap px-4 py-3.5 align-middle tabular-nums lg:table-cell">
                      {dateFmt.format(new Date(m.meetingAt))}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <Link
                        href={`/dashboard/rendez-vous/${m.id}`}
                        className={cn(
                          buttonVariants({
                            variant: "ghost",
                            size: "icon-sm",
                          }),
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
      </div>
    </div>
  );
}
