import { cardSubsectionTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import type { ProfileActionableAdvice } from "@/src/core/domain/analysis-result-zod";

const adviceBlocks = [
  { key: "whatItMeans", title: "Ce que ça veut dire" },
  { key: "howToTalk", title: "Comment lui parler" },
  { key: "whatToAvoid", title: "Quoi éviter" },
] as const satisfies ReadonlyArray<{
  key: keyof ProfileActionableAdvice;
  title: string;
}>;

export function ProfileActionableAdviceSection({
  advice,
  className,
}: {
  advice: ProfileActionableAdvice;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-3 border-t border-border pt-4 dark:border-zinc-800",
        className,
      )}
    >
      <p className={cardSubsectionTitleClass}>Conseils actionnables</p>
      <div className="grid gap-3 sm:grid-cols-1">
        {adviceBlocks.map(({ key, title }) => (
          <div
            key={key}
            className="rounded-lg border border-border/80 bg-muted/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <p className="text-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
              {title}
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {advice[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
