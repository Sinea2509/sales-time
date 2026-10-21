import { BarRow } from "@/components/molecules/bar-row";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { levelColor } from "@/lib/data-palette";
import { plurielFr } from "@/lib/pluriel-fr";
import type { ScorecardBlockAverage } from "@/src/core/domain/scorecard-team-axes";

/**
 * Les axes d'amélioration de l'équipe : la moyenne de chaque bloc de la
 * grille sur les rendez-vous notés de la période, du plus en retrait au plus
 * solide. Un bloc bas chez tout le monde est un sujet d'atelier, pas de
 * coaching individuel, et la carte le dit.
 *
 * Chaque bloc avait sa couleur, sans signification ; depuis l'audit du
 * 21 octobre 2026, la couleur dit le niveau (`levelColor`).
 */
export function TeamBlockAxesCard({
  axes,
  scorecards,
}: {
  axes: ScorecardBlockAverage[];
  scorecards: number;
}) {
  const weakest = axes[0];
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div>
          <h2 className={cardTitleClass}>
            Les axes d&apos;amélioration de l&apos;équipe
          </h2>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Moyenne de chaque bloc de la grille sur les rendez-vous notés de la
            période, du plus en retrait au plus solide.
          </p>
        </div>
        {axes.length === 0 ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Aucun rendez-vous de découverte noté sur la période : les blocs de
            la grille apparaîtront ici avec la première scorecard.
          </p>
        ) : (
          <>
            <div>
              {axes.map((a) => (
                <BarRow
                  key={a.key}
                  name={
                    <span className="truncate">
                      {a.key}. {a.name}
                    </span>
                  }
                  percent={a.avgPercent}
                  value={`${a.avgPercent} %`}
                  color={levelColor(a.avgPercent)}
                  title={`${a.name} : ${a.avgPercent} % en moyenne sur ${a.meetings} ${plurielFr(a.meetings, "rendez-vous")}`}
                />
              ))}
            </div>
            {weakest ? (
              <p className="text-muted-foreground text-sm leading-relaxed">
                Le bloc <b>{weakest.name.toLowerCase()}</b> est en retrait sur{" "}
                {scorecards}{" "}
                {plurielFr(scorecards, "rendez-vous noté", "rendez-vous notés")}
                , pas seulement chez un commercial. C&apos;est un sujet
                d&apos;atelier collectif, pas de coaching individuel.
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
