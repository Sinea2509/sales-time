import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type KpiTileProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  trend?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function KpiTile({
  icon: Icon,
  label,
  trend,
  children,
  footer,
  className,
}: KpiTileProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/10 bg-white p-5 text-zinc-900 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 dark:bg-brand/20">
          <Icon className="size-4 text-brand dark:text-brand-muted" />
        </div>
        <p className="text-muted-foreground truncate text-sm font-medium dark:text-zinc-400">
          {label}
        </p>
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
