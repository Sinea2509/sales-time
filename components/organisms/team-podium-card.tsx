import { TrophyIcon } from "@/components/atoms/trophy-icon";
import { TeamTierBadge } from "@/components/molecules/team-tier-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { ficheMembreHref } from "@/lib/liens-mon-equipe";
import { cardTitleClass } from "@/lib/page-typography";
import { prospectInitials } from "@/lib/prospect-initials";
import { podiumLabel } from "@/lib/stats-window-labels";
import { teamMemberDisplayName } from "@/lib/team-member-display-name";
import type { OrgAdminPodiumStep } from "@/src/core/application/get-org-admin-dashboard";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import { formatNoteFr } from "@/src/core/domain/team-ranking";

/**
 * Le podium de la période : les trois premiers du classement, avec leur
 * trophée, leur palier et leur note sur 5. C'est le même classement que le
 * tableau « Mon équipe » ; le podium n'en est que la tête.
 */
export function TeamPodiumCard({
  podium,
  statsWindowDays,
  equipePage,
}: {
  podium: OrgAdminPodiumStep[];
  statsWindowDays: StatsWindowDays;
  equipePage: number;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div>
          <h2 className={cardTitleClass}>
            Podium {podiumLabel(statsWindowDays)}
          </h2>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Sur la note moyenne des analyses, ramenée sur 5.
          </p>
        </div>
        {podium.length === 0 ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Personne n&apos;est encore classé : il faut trois rendez-vous
            analysés sur la période pour entrer au classement.
          </p>
        ) : (
          <ol className="divide-border divide-y">
            {podium.map((p) => {
              const name = teamMemberDisplayName(p);
              return (
                <li key={p.userId} className="flex items-center gap-3 py-2.5">
                  <TrophyIcon rank={p.rank} />
                  <span className="bg-muted grid size-7 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold dark:bg-zinc-800">
                    {prospectInitials(name.initialsSource)}
                  </span>
                  <Link
                    href={ficheMembreHref(
                      p.userId,
                      statsWindowDays,
                      equipePage,
                    )}
                    className="min-w-0 truncate text-sm font-semibold hover:underline"
                  >
                    {name.primary}
                  </Link>
                  <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">
                    {formatNoteFr(p.noteOn5)} sur 5
                  </span>
                  <TeamTierBadge tier={p.tier} />
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
