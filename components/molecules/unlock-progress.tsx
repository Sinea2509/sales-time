import { cn } from "@/lib/utils";

type Props = {
  /** Les rendez-vous analysés sur la période. */
  current: number;
  /** Combien il en faut pour débloquer ce qui attend. */
  target: number;
  /** Ce qui s'affichera une fois le seuil atteint, en fin de phrase. */
  unlocks: string;
  className?: string;
};

function rendezVousAnalyses(n: number): string {
  return n <= 1 ? `${n} rendez-vous analysé` : `${n} rendez-vous analysés`;
}

/**
 * Où en est un commercial avant qu'une carte s'affiche : combien de
 * rendez-vous il a, combien il en faut, et ce qu'il verra alors.
 *
 * Revue UX du 21 octobre 2026 : « Pas assez de données » ne dit ni combien il
 * en manque ni quand cela changera. Une barre le montre d'un coup d'œil.
 */
export function UnlockProgress({ current, target, unlocks, className }: Props) {
  const done = Math.min(current, target);
  const left = Math.max(target - current, 0);
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">
          {rendezVousAnalyses(done)} sur {target}
        </span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {done}/{target}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={done}
        aria-label={`${rendezVousAnalyses(done)} sur ${target}`}
        className="bg-muted h-2 overflow-hidden rounded-full"
      >
        <div
          className="st-bar h-full rounded-full bg-brand"
          style={{ width: `${(done / target) * 100}%` }}
        />
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {left === 1
          ? `Encore 1 rendez-vous pour voir ${unlocks}.`
          : `Encore ${left} rendez-vous pour voir ${unlocks}.`}
      </p>
    </div>
  );
}
