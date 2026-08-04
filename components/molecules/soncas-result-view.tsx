import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import {
  legendeEchelleProfil,
  nomDeTranche,
} from "@/lib/profile-score-bands-fr";
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
          Dominant prospect : <strong>{labels[result.dominant]}</strong>
        </p>
        {/*
          L'échelle est celle que la consigne impose au modèle : la dire ici
          évite de faire lire un 62 sans repère. Un levier sans citation ne
          peut pas dépasser la première tranche, autant l'annoncer aussi.
        */}
        <p className="text-muted-foreground text-xs">
          Intensité entendue dans l&apos;échange, sur 100 :{" "}
          {legendeEchelleProfil()}. Au-dessus de 19, chaque levier cite les mots
          du prospect.
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
                    <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                      {nomDeTranche(v.score)}
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
