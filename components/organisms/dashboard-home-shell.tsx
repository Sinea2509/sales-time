import { Suspense } from "react";
import { BrandCtaLink } from "@/components/molecules/brand-cta-link";
import { DataTableHead } from "@/components/molecules/data-table-head";
import { RendezVousMeetingRowActions } from "@/components/molecules/rendez-vous-meeting-row-actions";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import {
  meetingEtapeLabel,
  meetingEtapePillClass,
} from "@/lib/meeting-etape-pill";
import { prospectInitials } from "@/lib/prospect-initials";
import { sectionHeadingClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import type { PersonOutreachSummaryRow } from "@/src/core/ports/meeting-repository-port";

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function DashboardHomeShell({
  home,
  personOutreach = [],
}: {
  home: OrgDashboardHome;
  personOutreach?: PersonOutreachSummaryRow[];
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={sectionHeadingClass}>Mes KPI opérationnels</h2>
          <Suspense
            fallback={
              <Skeleton className="h-9 w-36 shrink-0 self-start rounded-md sm:self-auto" />
            }
          >
            <DashboardStatsPeriodSelect value={home.statsWindowDays} />
          </Suspense>
        </div>

        <DashboardKpiCards home={home} />
      </div>

      {personOutreach.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className={sectionHeadingClass}>Contacts à prioriser</h2>
            <p className="text-muted-foreground max-w-xl text-xs dark:text-zinc-500">
              Regroupement par personne : nombre de RDV, dernière interaction et
              score de relance (plus élevé = relancer en priorité).
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-brand/15 bg-gradient-to-br from-brand/8 via-white to-emerald-500/5 shadow-md dark:border-brand/25 dark:from-brand/15 dark:via-zinc-900 dark:to-emerald-500/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-brand/10 bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <DataTableHead className="px-4 py-3">Contact</DataTableHead>
                    <DataTableHead className="px-4 py-3">RDV</DataTableHead>
                    <DataTableHead className="px-4 py-3">
                      Dernier RDV
                    </DataTableHead>
                    <DataTableHead className="hidden px-4 py-3 sm:table-cell">
                      Durée moy.
                    </DataTableHead>
                    <DataTableHead className="px-4 py-3">
                      Priorité
                    </DataTableHead>
                    <DataTableHead className="px-4 py-3">
                      Dernière étape
                    </DataTableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {personOutreach.map((p) => (
                    <tr
                      key={p.personId}
                      className="bg-white/40 hover:bg-white/80 dark:bg-transparent dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand-hover dark:text-brand-muted">
                            {prospectInitials(p.displayName)}
                          </span>
                          <span className="font-medium text-zinc-950 dark:text-zinc-50">
                            {p.displayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                        {p.meetingCount}
                      </td>
                      <td className="text-muted-foreground px-4 py-3 tabular-nums dark:text-zinc-400">
                        {dateShort.format(new Date(p.lastMeetingAt))}
                      </td>
                      <td className="text-muted-foreground hidden px-4 py-3 tabular-nums sm:table-cell dark:text-zinc-400">
                        {p.avgDurationMin != null
                          ? `${p.avgDurationMin} min`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-brand/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-brand-hover dark:text-brand-muted">
                          {p.outreachPriorityScore}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                            meetingEtapePillClass(p.lastOutcome),
                          )}
                        >
                          {meetingEtapeLabel(p.lastOutcome)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <BrandCtaLink
          href="/company/rendez-vous/nouveau"
          variant="outline"
          className="h-10 rounded-md"
        >
          Préparer un RDV
        </BrandCtaLink>
        <BrandCtaLink
          href="/company/analyse"
          variant="primary"
          className="h-10 gap-1 rounded-md"
        >
          <span className="text-lg leading-none">+</span>
          Analyser un nouveau RDV
        </BrandCtaLink>
      </div>

      <section className="space-y-3">
        <h2 className={sectionHeadingClass}>Mes rendez-vous</h2>

        <div className="overflow-hidden rounded-2xl border border-zinc-200/10 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-950/80">
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-500">
                    Prospect
                  </DataTableHead>
                  <DataTableHead className="hidden px-4 py-3.5 sm:table-cell dark:text-zinc-500">
                    TAM
                  </DataTableHead>
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-500">
                    Date du RDV
                  </DataTableHead>
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-500">
                    Étape
                  </DataTableHead>
                  <DataTableHead className="hidden px-4 py-3.5 md:table-cell dark:text-zinc-500">
                    SalesScore
                  </DataTableHead>
                  <DataTableHead className="w-20 px-4 py-3.5 text-right dark:text-zinc-500">
                    Actions
                  </DataTableHead>
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
                        {formatDurationHoursMinutes(home.tamMinutesPerRdv)}
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
