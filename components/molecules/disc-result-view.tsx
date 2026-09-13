import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { PROFILE_SCORE_UNPROVEN_MAX } from "@/src/core/domain/profile-score-scale";
import type { DiscAnalysisResult } from "@/src/core/domain/analysis-result-zod";

type Props = { result: DiscAnalysisResult };

export function DiscResultView({ result }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={cardTitleClass}>DISC (prospect)</CardTitle>
        <p className="text-muted-foreground text-sm">
          Style principal détecté : <strong>{result.dominant}</strong>
        </p>
        {/*
          Même règle que SONCAS : le chiffre seul, sans mot de tranche. Les
          styles sont indépendants, ils ne se partagent pas cent points, et
          un style annoncé haut sans citation est ramené par le produit.
        */}
        <p className="text-muted-foreground text-xs">
          Chaque style est noté sur 100, indépendamment des trois autres.
          Au-dessus de {PROFILE_SCORE_UNPROVEN_MAX}, il cite les mots du
          prospect.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{result.summary}</p>
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          {(["D", "I", "S", "C"] as const).map((k) => (
            <div key={k} className="bg-muted/40 rounded-lg border p-2">
              <div className="text-muted-foreground text-xs">{k}</div>
              <div className="text-lg font-semibold tabular-nums">
                {result.scores[k]}
                <span className="text-muted-foreground ml-1 text-xs font-normal">
                  / 100
                </span>
              </div>
            </div>
          ))}
        </div>
        <ul className="text-muted-foreground list-inside list-disc text-xs">
          {result.evidence.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
