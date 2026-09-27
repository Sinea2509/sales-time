import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";

/**
 * Ce que le rendez-vous laisse pour le prochain : la question en or et le
 * défi. Ils ferment l'analyse, sous les onglets et sur toute la largeur,
 * plutôt que de se cacher dans l'onglet KISS : c'est la dernière chose que
 * le commercial doit lire avant de refermer la fiche.
 */
export function MeetingClosingCards({
  goldenQuestion,
  challenge,
}: {
  goldenQuestion: string | null;
  challenge: string | null;
}) {
  if (!goldenQuestion && !challenge) return null;
  return (
    <section
      aria-label="Pour le prochain rendez-vous"
      className="grid gap-4 sm:grid-cols-2"
    >
      {goldenQuestion ? (
        <Card className="border-brand/30 bg-brand-soft shadow-none dark:bg-brand/10">
          <CardContent className="space-y-2 pt-6">
            <h2 className={cardTitleClass}>Question en or</h2>
            <p className="text-muted-foreground text-xs">
              C&apos;est la question qui aurait le plus changé ce rendez-vous.
            </p>
            <p className="text-[13.5px] leading-relaxed italic">
              « {goldenQuestion} »
            </p>
          </CardContent>
        </Card>
      ) : null}
      {challenge ? (
        <Card>
          <CardContent className="space-y-2 pt-6">
            <h2 className={cardTitleClass}>Défi du prochain rendez-vous</h2>
            <p className="text-muted-foreground text-xs">
              Il tient en un seul geste, et la prochaine analyse dira s&apos;il
              a été fait.
            </p>
            <p className="text-[13.5px] leading-relaxed">{challenge}</p>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
