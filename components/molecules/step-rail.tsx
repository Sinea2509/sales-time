import { Fragment } from "react";
import { cn } from "@/lib/utils";

export type StepRailStep = { id: number; label: string };

type Props = {
  steps: readonly StepRailStep[];
  current: number;
  className?: string;
};

/**
 * Le fil des étapes d'un parcours : un carré numéroté par étape, relié au
 * suivant, coloré jusqu'à l'étape en cours. Partagé par le parcours de
 * création d'organisation et le guide de démarrage des invités.
 */
export function StepRail({ steps, current, className }: Props) {
  return (
    <nav
      className={cn("flex w-full flex-col items-center", className)}
      aria-label="Étapes du parcours"
    >
      <div className="mx-auto flex w-full max-w-lg items-start justify-center gap-0.5 sm:gap-1">
        {steps.map((s, index) => {
          const isDone = current > s.id;
          const isCurrent = current === s.id;
          const isDoneOrCurrent = isDone || isCurrent;
          return (
            <Fragment key={s.id}>
              <div className="flex w-14 shrink-0 flex-col items-center gap-1.5 sm:w-20">
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Étape ${s.id} : ${s.label}`}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg text-sm font-semibold tabular-nums transition-colors sm:size-10",
                    isDoneOrCurrent &&
                      "bg-gradient-to-br from-[#A48BFF] to-[#5B3DF5] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(108,77,255,0.7)]",
                    !isDoneOrCurrent &&
                      "bg-muted text-muted-foreground dark:bg-neutral-700 dark:text-neutral-400",
                  )}
                >
                  {s.id}
                </span>
                <span
                  className={cn(
                    "text-center text-[11px] font-normal leading-snug sm:text-sm",
                    isDoneOrCurrent && "text-brand dark:text-brand-muted",
                    !isDoneOrCurrent && "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <div
                  className={cn(
                    "mx-0.5 mt-[0.9375rem] h-0.5 min-w-[0.375rem] flex-1 rounded-full sm:mx-1 sm:mt-[1.125rem]",
                    current > s.id
                      ? "bg-brand"
                      : "bg-muted dark:bg-neutral-700",
                  )}
                  aria-hidden
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}
