import { TrophyIcon } from "@/components/atoms/trophy-icon";
import { TeamTierBadge } from "@/components/molecules/team-tier-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { ficheMembreHref } from "@/lib/liens-mon-equipe";
import { cardTitleClass } from "@/lib/page-typography";
import { prospectInitials } from "@/lib/prospect-initials";
import { podiumLabel } from "@/lib/stats-window-labels";
import { teamMemberDisplayName } from "@/lib/team-member-display-name";
import type {
  OrgAdminPodiumStep,
  OrgAdminPodiumWaiting,
} from "@/src/core/application/get-org-admin-dashboard";
import type {
  StatsWindowDays,
  StatsWindowRange,
} from "@/src/core/domain/dashboard-stats-window";
import { formatNoteFr } from "@/src/core/domain/team-ranking";

/**
 * Le podium de la période : les trois premiers du classement, avec leur
 * trophée, leur palier et leur note sur 5. C'est le même classement que le
 * tableau « Mon équipe » ; le podium n'en est que la tête.
 */
export function TeamPodiumCard({
  podium,
  waiting = [],
  minScoredMeetings,
  statsWindowDays,
  statsWindowRange = null,
  equipePage,
}: {
  podium: OrgAdminPodiumStep[];
  /** Notés, mais sous le seuil du classement. */
  waiting?: OrgAdminPodiumWaiting[];
  minScoredMeetings: number;
  statsWindowDays: StatsWindowDays;
  statsWindowRange?: StatsWindowRange | null;
  equipePage: number;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div>
          <h2 className={cardTitleClass}>
            Podium {podiumLabel(statsWindowDays, statsWindowRange)}
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
                      { days: statsWindowDays, range: statsWindowRange },
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
        {/*
          Audit du 21 octobre 2026 : un membre noté mais sous le seuil
          n'apparaissait nulle part ici, et le podium semblait se tromper. Il
          est listé à part, avec ce qui lui manque pour entrer au classement.
        */}
        {waiting.length > 0 ? (
          <div className="border-t border-border pt-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              Pas encore classés
            </p>
            <ul className="space-y-2">
              {waiting.map((w) => {
                const name = teamMemberDisplayName(w);
                return (
                  <li key={w.userId} className="flex items-center gap-3">
                    <span className="bg-muted grid size-7 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold dark:bg-zinc-800">
                      {prospectInitials(name.initialsSource)}
                    </span>
                    <span className="min-w-0 truncate text-sm">
                      {name.primary}
                    </span>
                    <span className="bg-muted text-muted-foreground ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums dark:bg-zinc-800">
                      {w.scoredMeetings} RDV sur {minScoredMeetings}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
