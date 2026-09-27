import { KissResultView } from "@/components/molecules/kiss-result-view";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";

export function MeetingKissTab({
  kiss,
  pending,
}: {
  kiss: KissAnalysisResult | null;
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
    </div>
  );
}
