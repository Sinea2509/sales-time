import Link from "next/link";
import { Suspense } from "react";
import { RendezVousMeetingRowActions } from "@/components/molecules/rendez-vous-meeting-row-actions";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ESTIMATED_TAM_EUR_PER_RDV } from "@/lib/dashboard-estimates";
import { meetingEtapeLabel, meetingEtapePillClass } from "@/lib/meeting-etape-pill";
import { prospectInitials } from "@/lib/prospect-initials";
import { cn } from "@/lib/utils";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

const eurCompact = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function DashboardHomeShell({ home }: { home: OrgDashboardHome }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          Mes statistiques
        </h2>
        <Suspense
          fallback={
            <Skeleton className="h-9 w-36 shrink-0 self-start rounded-md sm:self-auto" />
          }
        >
          <DashboardStatsPeriodSelect value={home.statsWindowDays} />
        </Suspense>
      </div>

      <DashboardKpiCards home={home} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/dashboard/rendez-vous/nouveau"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 rounded-lg border-[#6C4DFF]/25 bg-[#6C4DFF]/10 px-4 text-[#5a3fd9] hover:bg-[#6C4DFF]/15 dark:text-[#c4b5fd]",
          )}
        >
          Préparer un RDV
        </Link>
        <Link
          href="/dashboard/analyse"
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-10 gap-1 rounded-lg border-0 bg-[#6C4DFF] px-4 text-white hover:bg-[#5a3fd9]",
          )}
        >
          <span className="text-lg leading-none">+</span>
          Analyser un nouveau RDV
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          Mes rendez-vous
        </h2>

        <div className="overflow-hidden rounded-2xl border border-zinc-200/10 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-950/80">
                  <th className="text-muted-foreground px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase dark:text-zinc-500">
                    Prospect
                  </th>
                  <th className="text-muted-foreground hidden px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase sm:table-cell dark:text-zinc-500">
                    Potentiel
                  </th>
                  <th className="text-muted-foreground px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase dark:text-zinc-500">
                    Date du RDV
                  </th>
                  <th className="text-muted-foreground px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase dark:text-zinc-500">
                    Étape
                  </th>
                  <th className="text-muted-foreground hidden px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase md:table-cell dark:text-zinc-500">
                    SalesScore
                  </th>
                  <th className="text-muted-foreground w-20 px-4 py-3.5 text-right text-[11px] font-semibold tracking-wider uppercase dark:text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {home.recentMeetings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted-foreground px-4 py-12 text-center dark:text-zinc-500"
                    >
                      Aucun rendez-vous.
                    </td>
                  </tr>
                ) : (
                  home.recentMeetings.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            {prospectInitials(m.prospectName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
                              {m.prospectName}
                            </p>
                            <p className="text-muted-foreground truncate text-xs dark:text-zinc-500">
                              Entreprise
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted-foreground hidden whitespace-nowrap px-4 py-3.5 align-middle tabular-nums sm:table-cell dark:text-zinc-400">
                        {eurCompact.format(ESTIMATED_TAM_EUR_PER_RDV)}
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap px-4 py-3.5 align-middle tabular-nums dark:text-zinc-400">
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
                          <span className="text-zinc-900 text-base font-semibold tabular-nums dark:text-zinc-100">
                            {m.salesScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground dark:text-zinc-500">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right align-middle">
                        <RendezVousMeetingRowActions
                          meetingId={m.id}
                          prospectName={m.prospectName}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
