import type { ComponentType, ReactNode } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { statAccentStyles, type StatAccent } from "@/lib/stat-accent-styles";
import { cn } from "@/lib/utils";

export type KpiTileProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  /** Definition shown on hover of the info icon beside the label. */
  labelTooltip?: string;
  trend?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** When set, icon tile uses admin accent colors instead of brand. */
  accent?: StatAccent;
};

export function KpiTile({
  icon: Icon,
  label,
  labelTooltip,
  trend,
  children,
  footer,
  className,
  accent,
}: KpiTileProps) {
  const accentColors = accent ? statAccentStyles[accent] : null;

  const shellClass = cn(
    "rounded-2xl border border-zinc-200/10 bg-white p-5 text-zinc-900 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50",
    className,
  );

  return (
    <div className={shellClass}>
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            accentColors
              ? cn("rounded-lg", accentColors.bg)
              : "bg-brand/10 dark:bg-brand/20",
          )}
        >
          <Icon
            className={cn(
              "size-4",
              accentColors
                ? accentColors.icon
                : "text-brand dark:text-brand-muted",
            )}
          />
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="text-muted-foreground truncate text-sm font-medium dark:text-zinc-400">
            {label}
          </p>
          {labelTooltip ? (
            <Tooltip>
              <TooltipTrigger
                type="button"
                className="text-muted-foreground hover:text-foreground inline-flex shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
                aria-label={`Définition : ${label}`}
              >
                <Info className="size-3.5" aria-hidden />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="start"
                className="max-w-sm text-left leading-relaxed"
              >
                {labelTooltip}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-3xl font-semibold tabular-nums">{children}</p>
        {trend ? <div className="shrink-0">{trend}</div> : null}
      </div>
      {footer ? (
        <p className="text-muted-foreground mt-1 text-xs dark:text-zinc-400">
          {footer}
        </p>
      ) : null}
    </div>
  );
}
