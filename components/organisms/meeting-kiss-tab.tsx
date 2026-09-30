import { KissResultView } from "@/components/molecules/kiss-result-view";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";

export function MeetingKissTab({
  kiss,
  challenge,
  pending,
}: {
  kiss: KissAnalysisResult | null;
  /** Le défi du prochain rendez-vous, porté par la scorecard quand elle existe. */
  challenge: string | null;
  pending: boolean;
}) {
  if (!kiss) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className={cardTitleClass}>KISS</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {pending
              ? "Coaching KISS en cours de rédaction…"
              : "Pas de coaching KISS pour ce rendez-vous."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className={cardTitleClass}>KISS</h2>
            <p className="text-muted-foreground mt-1 max-w-[64ch] text-xs leading-relaxed">
              Ce que nous vous conseillons à partir de ce rendez-vous : ce qui a
              marché et qu&apos;il faut garder, ce qui gagnerait à être
              amélioré, ce qu&apos;il vaut mieux arrêter, et ce qu&apos;il reste
              à démarrer. Ce sont des suggestions, pas des consignes.
            </p>
          </div>
          <KissResultView result={kiss} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-brand/30 bg-brand-soft shadow-none dark:bg-brand/10">
          <CardContent className="space-y-2 pt-6">
            <h2 className={cardTitleClass}>Question en or</h2>
            <p className="text-muted-foreground text-xs">
              C&apos;est la question qui aurait le plus changé ce rendez-vous.
            </p>
            <p className="text-[13.5px] leading-relaxed italic">
              « {kiss.goldenQuestion} »
            </p>
          </CardContent>
        </Card>
        {challenge ? (
          <Card>
            <CardContent className="space-y-2 pt-6">
              <h2 className={cardTitleClass}>Défi du prochain rendez-vous</h2>
              <p className="text-muted-foreground text-xs">
                Il tient en un seul geste, et la prochaine analyse dira
                s&apos;il a été fait.
              </p>
              <p className="text-[13.5px] leading-relaxed">{challenge}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
