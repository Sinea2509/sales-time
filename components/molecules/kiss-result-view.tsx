import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";
import { DotBulletList } from "@/components/atoms/dot-bullet-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const blocks = [
  {
    key: "keep" as const,
    title: "À conserver (Keep)",
    className:
      "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/30",
  },
  {
    key: "improve" as const,
    title: "À améliorer (Improve)",
    className:
      "border-amber-200/80 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30",
  },
  {
    key: "stop" as const,
    title: "À arrêter (Stop)",
    className:
      "border-rose-200/80 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/30",
  },
  {
    key: "start" as const,
    title: "À démarrer (Start)",
    className:
      "border-sky-200/80 bg-sky-50/80 dark:border-sky-900/40 dark:bg-sky-950/30",
  },
] as const;

function sanitizeKissBullet(line: string): string {
  return line.replace(/^[\s\-–—•·]+\s*/, "").trim();
}

export function KissResultView({ result }: { result: KissAnalysisResult }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {blocks.map(({ key, title, className }) => (
        <Card key={key} className={className}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DotBulletList
              items={result[key].map(sanitizeKissBullet).filter(Boolean)}
              density="compact"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
