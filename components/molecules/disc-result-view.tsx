import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import {
  legendeEchelleProfil,
  nomDeTranche,
} from "@/lib/profile-score-bands-fr";
import type { DiscAnalysisResult } from "@/src/core/domain/analysis-result-zod";

type Props = { result: DiscAnalysisResult };

export function DiscResultView({ result }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={cardTitleClass}>DISC (prospect)</CardTitle>
        <p className="text-muted-foreground text-sm">
          Style dominant : <strong>{result.dominant}</strong>
        </p>
        {/*
          La même échelle que SONCAS, et la même raison : quatre chiffres
          sans repère se lisent comme quatre impressions. Les styles sont
          indépendants, ils ne se partagent pas cent points.
        */}
        <p className="text-muted-foreground text-xs">
          Intensité entendue dans l&apos;échange, sur 100 :{" "}
          {legendeEchelleProfil()}. Les quatre styles sont notés indépendamment.
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
              </div>
              <div className="text-muted-foreground text-[11px]">
                {nomDeTranche(result.scores[k])}
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
