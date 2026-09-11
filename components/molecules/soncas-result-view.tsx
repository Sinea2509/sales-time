import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { PROFILE_SCORE_UNPROVEN_MAX } from "@/src/core/domain/profile-score-scale";
import type { SoncasAnalysisResult } from "@/src/core/domain/analysis-result-zod";

const labels: Record<keyof SoncasAnalysisResult["drivers"], string> = {
  securite: "Sécurité",
  orgueil: "Orgueil",
  nouveaute: "Nouveauté",
  confort: "Confort",
  argent: "Argent",
  sympathie: "Sympathie",
};

const driverKeys: Array<keyof SoncasAnalysisResult["drivers"]> = [
  "securite",
  "orgueil",
  "nouveaute",
  "confort",
  "argent",
  "sympathie",
];

type Props = { result: SoncasAnalysisResult };

export function SoncasResultView({ result }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={cardTitleClass}>SONCAS (prospect)</CardTitle>
        <p className="text-muted-foreground text-sm">
          Levier principal détecté : <strong>{labels[result.dominant]}</strong>
        </p>
        {/*
          Seul le score sur 100 reste à côté de chaque levier. Les mots qui
          nommaient les tranches (absent, ténu, net, marqué, omniprésent)
          doublaient le chiffre d'un jugement, et la revue les a retirés :
          « on met rien ». La règle de preuve, elle, reste dite une fois pour
          toutes : un levier sans citation ne dépasse pas la première tranche.
        */}
        <p className="text-muted-foreground text-xs">
          Chaque levier est noté sur 100. Au-dessus de{" "}
          {PROFILE_SCORE_UNPROVEN_MAX}, il cite les mots du prospect.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{result.summary}</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {driverKeys.map((key) => {
            const v = result.drivers[key];
            return (
              <li
                key={key}
                className="bg-muted/40 rounded-lg border p-3 text-sm"
              >
                <div className="flex items-baseline justify-between gap-2 font-medium">
                  <span>{labels[key]}</span>
                  <span className="whitespace-nowrap tabular-nums">
                    {v.score}
                    <span className="text-muted-foreground ml-1 text-xs font-normal">
                      / 100
                    </span>
                  </span>
                </div>
                <ul className="text-muted-foreground mt-2 list-inside list-disc text-xs">
                  {v.evidence.slice(0, 3).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
