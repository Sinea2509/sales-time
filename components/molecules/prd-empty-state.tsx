import type { LucideIcon } from "lucide-react";

type PrdEmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
};

export function PrdEmptyState({
  title,
  description,
  icon: Icon,
  action,
}: PrdEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900/30">
      {Icon ? (
        <Icon
          aria-hidden
          className="text-muted-foreground mb-3 size-10 opacity-60"
        />
      ) : null}
      <h3 className="text-base font-semibold text-foreground dark:text-neutral-100">
        {title}
      </h3>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
