import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SoncasAnalysisResult } from "@/lib/analysis-result-zod";

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
        <CardTitle className="text-base">SONCAS</CardTitle>
        <p className="text-muted-foreground text-sm">
          Dominant prospect :{" "}
          <strong>{labels[result.dominant]}</strong>
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
                <div className="flex justify-between font-medium">
                  <span>{labels[key]}</span>
                  <span>{v.score}</span>
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
