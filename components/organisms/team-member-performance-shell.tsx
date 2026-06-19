import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { OrgAdminKissQuadrantGrid } from "@/components/organisms/org-admin-kiss-quadrant-grid";
import { ProfileAffinityHorizontalBars } from "@/components/molecules/profile-affinity-horizontal-bars";
import type { OrgAdminKissTeamRollup } from "@/src/core/application/get-org-admin-dashboard";
import {
  cardProseBodyClass,
  cardSubsectionTitleClass,
  cardTitleClass,
  pageTitleClass,
  sectionHeadingClass,
} from "@/lib/page-typography";
import { cn } from "@/lib/utils";

function statColumn({
  value,
  label,
  title,
}: {
  value: string;
  label: string;
  title?: string;
}) {
  return (
    <div
      className="flex min-w-[4.5rem] flex-col items-start gap-1 sm:min-w-[5.5rem]"
      title={title}
    >
      <span className="text-foreground text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </span>
      <span className="text-muted-foreground max-w-[7rem] text-left text-[11px] font-medium leading-tight">
        {label}
      </span>
    </div>
  );
}
export type TeamMemberPerformanceShellProps = {
  nameLine: string;
  initials: string;
  posture: string | null;
  nbRdvs: number;
  decouverte: number;
  proposition: number;
  /** TAM cumulé — somme des durées de conversation utile sur la fenêtre. */
  tamCumuleMinutes: number;
  performanceForces: string | null;
  performanceAxes: string | null;
  performanceStop: string | null;
  discBarItems: { key: string; label: string; pct: number; barClass: string }[];
  soncasBarItems: { key: string; label: string; pct: number; barClass: string }[];
  discAffinityText: string | null;
  soncasAffinityText: string | null;
  kissSellerStrengthsNarrative: string | null;
  kissSellerRollup: OrgAdminKissTeamRollup;
};

export function TeamMemberPerformanceShell({
  nameLine,
  initials,
  posture,
  nbRdvs,
  decouverte,
  proposition,
  tamCumuleMinutes,
  performanceForces,
  performanceAxes,
  performanceStop,
  discBarItems,
  soncasBarItems,
  discAffinityText,
  soncasAffinityText,
  kissSellerStrengthsNarrative,
  kissSellerRollup,
}: TeamMemberPerformanceShellProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700/80">
            {initials}
          </span>
          <div className="flex max-w-md flex-col items-center gap-1 text-center sm:items-start sm:text-left">
            <p className={pageTitleClass}>{nameLine}</p>
            {posture ? (
              <Badge
                variant="secondary"
                className="mt-0.5 px-2.5 py-0.5 text-xs font-medium"
              >
                Posture · {posture}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="mt-0.5 px-2.5 py-0.5 text-xs font-normal text-muted-foreground"
              >
                Posture · —
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-start justify-center gap-8 self-start border-t border-zinc-200 pt-6 sm:justify-end sm:border-t-0 sm:pt-0 lg:min-w-0 dark:border-zinc-800">
          {statColumn({
            value: String(nbRdvs),
            label: "RDVs",
          })}
          {statColumn({
            value: String(decouverte),
            label: "RDVs Découverte",
          })}
          {statColumn({
            value: String(proposition),
            label: "RDVs Proposition",
          })}
          {statColumn({
            value:
              tamCumuleMinutes > 0
                ? formatDurationHoursMinutes(tamCumuleMinutes)
                : "—",
            label: "TAM cumulé",
            title:
              "Temps de conversation utile cumulé sur les RDV connectés de ce commercial (durée renseignée)",
          })}
        </div>
      </div>

      <Card
        size="sm"
        className="overflow-hidden border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <CardHeader className="pb-3">
          <CardTitle
            className={cn(cardTitleClass, "flex flex-row items-center gap-2")}
          >
            Profil de performance
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100/90 ring-1 ring-violet-300/50 dark:bg-violet-950/60 dark:ring-violet-700/40"
              aria-hidden
            >
              <Sparkles
                className="size-3 text-violet-600 drop-shadow-[0_0_6px_rgba(139,92,246,0.4)] dark:text-violet-300 dark:drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]"
                strokeWidth={2}
              />
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-8">
            <section>
              <h3 className={cardSubsectionTitleClass}>Forces</h3>
              <p
                className={cn(
                  cardProseBodyClass,
                  "mt-2 whitespace-pre-wrap dark:text-zinc-200/90",
                )}
              >
                {performanceForces}
              </p>
            </section>
            <section>
              <h3 className={cardSubsectionTitleClass}>
                Axes d&apos;amélioration
              </h3>
              <p
                className={cn(
                  cardProseBodyClass,
                  "mt-2 whitespace-pre-wrap dark:text-zinc-200/90",
                )}
              >
                {performanceAxes}
              </p>
            </section>
            <section>
              <h3 className={cardSubsectionTitleClass}>À stopper</h3>
              <p
                className={cn(
                  cardProseBodyClass,
                  "mt-2 whitespace-pre-wrap dark:text-zinc-200/90",
                )}
              >
                {performanceStop}
              </p>
            </section>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          size="sm"
          className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <CardHeader className="pb-3">
            <CardTitle className={cardTitleClass}>
              Affinité relationnelle par profil DISC
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ProfileAffinityHorizontalBars items={discBarItems} />
            {discAffinityText?.trim() ? (
              <p className="text-muted-foreground mt-5 border-t border-zinc-100 pt-5 text-sm leading-relaxed whitespace-pre-wrap dark:border-zinc-800">
                {discAffinityText.trim()}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card
          size="sm"
          className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <CardHeader className="pb-3">
            <CardTitle className={cardTitleClass}>
              Affinité relationnelle par profil SONCAS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ProfileAffinityHorizontalBars items={soncasBarItems} />
            {soncasAffinityText?.trim() ? (
              <p className="text-muted-foreground mt-5 border-t border-zinc-100 pt-5 text-sm leading-relaxed whitespace-pre-wrap dark:border-zinc-800">
                {soncasAffinityText.trim()}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Coaching KISS</h2>
        {kissSellerStrengthsNarrative?.trim() ? (
          <p className={cn(cardProseBodyClass, "max-w-3xl")}>
            {kissSellerStrengthsNarrative.trim()}
          </p>
        ) : null}
        <OrgAdminKissQuadrantGrid
          rollup={kissSellerRollup}
          presentation="managerMemberProfile"
        />
      </section>
    </div>
  );
}
