import { ToneChip } from "@/components/atoms/tone-chip";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cardTitleClass } from "@/lib/page-typography";
import { plurielFr } from "@/lib/pluriel-fr";
import { cn } from "@/lib/utils";
import type { SellerMonthlyAxis } from "@/src/core/domain/scorecard-team-axes";
import type { SellerTopSkill } from "@/src/core/domain/seller-top-skills";

/**
 * Les deux cartes du mois du commercial, comme la maquette du 11 septembre
 * les pose sous les tuiles : l'axe d'amélioration, tiré du bloc de la grille
 * le plus souvent en retrait, et les points forts, tirés des six compétences
 * notées par le coaching.
 *
 * Chaque carte mène quelque part : l'axe vers le rendez-vous qui l'illustre
 * le mieux, les points forts vers le profil de vente complet.
 */
export function CommercialMonthFocusCards({
  axis,
  strengths,
  profileHref,
}: {
  axis: SellerMonthlyAxis | null;
  strengths: { skills: SellerTopSkill[]; meetings: number };
  profileHref: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div>
            <h2 className={cardTitleClass}>
              Votre axe d&apos;amélioration du mois
            </h2>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              C&apos;est le bloc de la grille qui revient le plus souvent en
              retrait sur vos analyses.
            </p>
          </div>
          {axis ? (
            <>
              <div className="flex flex-wrap items-center gap-2.5">
                <ToneChip tone="warn">
                  {axis.key}. {axis.name}
                </ToneChip>
                <span className="text-sm font-bold tabular-nums">
                  {axis.avgPercent} % en moyenne
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {axis.lowMeetings > 0
                  ? `Ce bloc reste sous les 60 % dans ${axis.lowMeetings} de vos ${axis.meetings} ${plurielFr(axis.meetings, "dernier rendez-vous noté", "derniers rendez-vous notés")}. C'est le premier levier de progression, devant tout le reste.`
                  : `Ce bloc est le plus bas de votre grille, sans jamais tomber sous les 60 % sur vos ${axis.meetings} ${plurielFr(axis.meetings, "dernier rendez-vous noté", "derniers rendez-vous notés")} : c'est là que se gagnent les prochains points.`}
              </p>
              {axis.exampleMeetingId ? (
                <Link
                  href={`/company/rendez-vous/${axis.exampleMeetingId}`}
                  className={cn(buttonVariants({ size: "sm" }), "mt-1")}
                >
                  Voir un exemple concret
                </Link>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Votre axe du mois se lit sur les scorecards de vos rendez-vous de
              découverte. Analysez-en un pour le voir apparaître ici.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div>
            <h2 className={cardTitleClass}>Vos points forts du mois</h2>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Ce sur quoi vous pouvez vous appuyer, d&apos;après les mêmes
              analyses.
            </p>
          </div>
          {strengths.skills.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {strengths.skills.map((s) => (
                  <ToneChip key={s.key} tone="ok">
                    {s.label}, {s.score} sur 100
                  </ToneChip>
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ces compétences sont vos mieux notées sur vos{" "}
                {strengths.meetings}{" "}
                {plurielFr(
                  strengths.meetings,
                  "dernier rendez-vous coaché",
                  "derniers rendez-vous coachés",
                )}
                . Un point fort se cultive : c&apos;est celui que le prospect
                retient de vous.
              </p>
              <Link
                href={profileHref}
                className={cn(buttonVariants({ size: "sm" }), "mt-1")}
              >
                Voir mon profil de vente
              </Link>
            </>
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vos points forts se lisent sur le coaching de vos rendez-vous
              analysés. Ils apparaîtront ici dès le premier.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
