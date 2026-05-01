import { Suspense } from "react";
import { MoreHorizontal } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DashboardAddMemberPopover } from "@/components/molecules/dashboard-add-member-popover";
import { DataTableHead } from "@/components/molecules/data-table-head";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import { OrgAdminDonutDistributionCard } from "@/components/organisms/org-admin-donut-distribution-card";
import { OrgAdminKissQuadrantGrid } from "@/components/organisms/org-admin-kiss-quadrant-grid";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { prospectInitials } from "@/lib/prospect-initials";
import { sectionHeadingClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import type {
  OrgAdminDashboard,
  OrgAdminMonEquipeRow,
} from "@/src/core/application/get-org-admin-dashboard";

function monEquipeListHref(jours: number, equipePage: number) {
  const q = new URLSearchParams();
  q.set("jours", String(jours));
  if (equipePage > 1) {
    q.set("equipePage", String(equipePage));
  }
  return `/company?${q.toString()}`;
}

function monEquipePersonLines(row: OrgAdminMonEquipeRow) {
  const full = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  if (full) {
    return { primary: full, secondary: row.email, initialsSource: full };
  }
  return { primary: row.email, secondary: null, initialsSource: row.email };
}

export function DashboardAdminShell({
  admin,
  kissTeamStrengthsNarrative,
}: {
  admin: OrgAdminDashboard;
  kissTeamStrengthsNarrative?: string | null;
}) {
  const { home, monEquipe, discPie, soncasPie, kissTeamRollup } = admin;
  const jours = admin.statsWindowDays;
  const lastPage = Math.max(
    1,
    Math.ceil(monEquipe.totalCount / monEquipe.pageSize),
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={sectionHeadingClass}>Indicateurs détaillés</h2>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <DashboardAddMemberPopover />
      </div>

      <section className="space-y-3">
        <h2 className={sectionHeadingClass}>Mon équipe</h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-200/10 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-950/80">
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-500">
                    Personne
                  </DataTableHead>
                  <DataTableHead className="px-4 py-3.5 tabular-nums dark:text-zinc-500">
                    RDVs
                  </DataTableHead>
                  <DataTableHead
                    className="px-4 py-3.5 tabular-nums dark:text-zinc-500"
                    title="Nombre de RDV avec au moins une analyse KISS"
                  >
                    Coachings
                  </DataTableHead>
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-500">
                    TAM
                  </DataTableHead>
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-500">
                    Posture
                  </DataTableHead>
                  <DataTableHead className="w-14 px-4 py-3.5 text-right dark:text-zinc-500">
                    Actions
                  </DataTableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {monEquipe.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted-foreground px-4 py-12 text-center dark:text-zinc-500"
                    >
                      Aucun membre dans cette organisation.
                    </td>
                  </tr>
                ) : (
                  monEquipe.rows.map((row) => {
                    const person = monEquipePersonLines(row);
                    return (
                      <tr
                        key={row.userId}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-4 py-3.5 align-middle">
                          <Link
                            href={
                              jours === 30
                                ? `/company/equipe/${row.userId}`
                                : `/company/equipe/${row.userId}?jours=${jours}`
                            }
                            className="group flex min-w-0 items-center gap-3 rounded-lg py-0.5 pr-2 outline-none transition-colors hover:bg-zinc-100/90 focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:hover:bg-zinc-800/60 dark:focus-visible:ring-zinc-500/40"
                            aria-label={`Fiche de ${person.primary}`}
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                              {prospectInitials(person.initialsSource)}
                            </span>
                            <div className="min-w-0 text-left">
                              <p className="truncate font-medium text-zinc-950 underline-offset-2 group-hover:underline dark:text-zinc-50">
                                {person.primary}
                              </p>
                              {person.secondary ? (
                                <p className="text-muted-foreground truncate text-xs dark:text-zinc-500">
                                  {person.secondary}
                                </p>
                              ) : null}
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 tabular-nums">
                          {row.nbRdvs}
                        </td>
                        <td className="px-4 py-3.5 tabular-nums">
                          {row.coachesCount}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">
                          {formatDurationHoursMinutes(row.tamMinutesCumule)}
                        </td>
                        <td className="text-muted-foreground max-w-[10rem] truncate px-4 py-3.5 dark:text-zinc-400">
                          {row.postureLabel ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right align-middle">
                          <Link
                            href="/company/settings/equipe"
                            className={cn(
                              buttonVariants({
                                variant: "outline",
                                size: "icon-sm",
                              }),
                              "inline-flex",
                            )}
                            aria-label="Paramètres équipe et membres"
                          >
                            <MoreHorizontal className="size-4" aria-hidden />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        {monEquipe.totalCount > monEquipe.pageSize ? (
          <div className="text-muted-foreground flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between dark:text-zinc-500">
            <span>
              {monEquipe.totalCount} membre
              {monEquipe.totalCount > 1 ? "s" : ""} — page {monEquipe.page} sur{" "}
              {lastPage}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {monEquipe.page > 1 ? (
                <Link
                  href={monEquipeListHref(jours, monEquipe.page - 1)}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8",
                  )}
                >
                  Précédent
                </Link>
              ) : null}
              {monEquipe.page < lastPage ? (
                <Link
                  href={monEquipeListHref(jours, monEquipe.page + 1)}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8",
                  )}
                >
                  Suivant
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Statistiques globales</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <OrgAdminDonutDistributionCard
            title="Répartition par DISC"
            data={discPie}
          />
          <OrgAdminDonutDistributionCard
            title="Répartition par SONCAS"
            data={soncasPie}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Coaching KISS</h2>
        {kissTeamStrengthsNarrative?.trim() ? (
          <p className="text-foreground max-w-3xl text-sm leading-relaxed">
            {kissTeamStrengthsNarrative.trim()}
          </p>
        ) : null}
        <OrgAdminKissQuadrantGrid rollup={kissTeamRollup} />
      </section>
    </div>
  );
}
