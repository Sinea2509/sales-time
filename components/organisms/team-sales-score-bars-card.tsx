import { BarRow } from "@/components/molecules/bar-row";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { ficheMembreHref } from "@/lib/liens-mon-equipe";
import { cardTitleClass } from "@/lib/page-typography";
import { prospectInitials } from "@/lib/prospect-initials";
import { rdvNotes } from "@/lib/accord-fr";
import { salesScoreColorClass } from "@/lib/sales-score-color";
import { statsWindowLabel } from "@/lib/stats-window-labels";
import { teamMemberDisplayName } from "@/lib/team-member-display-name";
import { cn } from "@/lib/utils";
import type { OrgAdminScoreBar } from "@/src/core/application/get-org-admin-dashboard";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";

/**
 * Le SalesScore moyen de chaque commercial, en barres, du plus haut au plus
 * bas. Chaque nom ouvre la fiche du membre : la barre pose la question, la
 * fiche y répond.
 *
 * Les barres se remplissent par rapport au meilleur score, pas à 100, comme
 * la maquette le fait : l'écart entre les commerciaux se voit alors à l'œil,
 * là où des barres toutes aux deux tiers se ressembleraient.
 */
export function TeamSalesScoreBarsCard({
  bars,
  statsWindowDays,
  equipePage,
}: {
  bars: OrgAdminScoreBar[];
  statsWindowDays: StatsWindowDays;
  equipePage: number;
}) {
  const max = Math.max(1, ...bars.map((b) => b.salesScoreAvg));
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div>
          <h2 className={cardTitleClass}>SalesScore moyen par commercial</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Moyenne sur les rendez-vous analysés des{" "}
            {statsWindowLabel(statsWindowDays)}. Cliquez un nom pour ouvrir sa
            fiche.
          </p>
        </div>
        {bars.length === 0 ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Aucun commercial n&apos;a de rendez-vous analysé sur la période.
          </p>
        ) : (
          <div>
            {bars.map((b) => {
              const name = teamMemberDisplayName(b);
              return (
                <BarRow
                  key={b.userId}
                  name={
                    <Link
                      href={ficheMembreHref(
                        b.userId,
                        statsWindowDays,
                        equipePage,
                      )}
                      className="flex min-w-0 items-center gap-2 hover:underline"
                      aria-label={`Ouvrir la fiche de ${name.primary}`}
                    >
                      <span className="bg-muted grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold dark:bg-zinc-800">
                        {prospectInitials(name.initialsSource)}
                      </span>
                      <span className="truncate">{name.primary}</span>
                    </Link>
                  }
                  percent={(100 * b.salesScoreAvg) / max}
                  value={
                    <span className={cn(salesScoreColorClass(b.salesScoreAvg))}>
                      {b.salesScoreAvg}
                    </span>
                  }
                  title={`${name.primary} : ${b.salesScoreAvg} sur 100, ${rdvNotes(b.scoredMeetings)}`}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
