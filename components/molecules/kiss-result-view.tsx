import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cardTitleClass } from "@/lib/page-typography";

const blocks = [
  {
    key: "keep" as const,
    title: "Keep",
    className:
      "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/30",
  },
  {
    key: "improve" as const,
    title: "Improve",
    className:
      "border-amber-200/80 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30",
  },
  {
    key: "stop" as const,
    title: "Stop",
    className:
      "border-rose-200/80 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/30",
  },
  {
    key: "start" as const,
    title: "Start",
    className:
      "border-sky-200/80 bg-sky-50/80 dark:border-sky-900/40 dark:bg-sky-950/30",
  },
] as const;

export function KissResultView({
  result,
  showCoachingScore = true,
}: {
  result: KissAnalysisResult;
  /** Réservé au commercial propriétaire du RDV (masqué manager / autres). */
  showCoachingScore?: boolean;
}) {
  return (
    <div className="space-y-4">
      {showCoachingScore ? (
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="text-base font-semibold">
            Score coaching : {result.coachingScore}/10
          </Badge>
        </div>
      ) : null}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={cardTitleClass}>Synthèse</CardTitle>
          <CardDescription>{result.summary}</CardDescription>
        </CardHeader>
        {showCoachingScore ? (
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground font-medium">
              Justification du score
            </p>
            <p className="leading-relaxed">
              {result.coachingScoreJustification}
            </p>
          </CardContent>
        ) : null}
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={cardTitleClass}>Golden question</CardTitle>
          <CardDescription className="text-foreground font-medium">
            {result.goldenQuestion}
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {blocks.map(({ key, title, className }) => (
          <Card key={key} className={className}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold tracking-wide uppercase">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed">
                {result[key].map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
