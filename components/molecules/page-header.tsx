import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageIconTile } from "@/components/atoms/page-icon-tile";
import { pageTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  backHref,
  backLabel,
  className,
}: PageHeaderProps) {
  const hasIconBlock = Icon != null || eyebrow != null;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className={cn("flex gap-4", !hasIconBlock && "min-w-0 flex-col gap-1")}>
        {Icon ? <PageIconTile icon={Icon} /> : null}
        <div className="min-w-0 space-y-1">
          {eyebrow ? (
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className={pageTitleClass}>{title}</h1>
          {description ? (
            <p className="text-muted-foreground text-sm text-pretty">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ?? (backHref ? (
        <Link
          href={backHref}
          className="border-input bg-background ring-offset-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 shrink-0 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {backLabel ?? "← Retour"}
        </Link>
      ) : null)}
    </div>
  );
}

/** Simple title + description without icon row (admin list pages). */
export function PageHeaderSimple({
  title,
  description,
  className,
}: Pick<PageHeaderProps, "title" | "description" | "className">) {
  return (
    <div className={cn("space-y-1", className)}>
      <h1 className={pageTitleClass}>{title}</h1>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
    </div>
  );
}

type PageDetailHeaderProps = {
  backHref: string;
  title: string;
  badges?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
};

/** Back link + title row with optional badges and meta line (admin detail pages). */
export function PageDetailHeader({
  backHref,
  title,
  badges,
  meta,
  className,
}: PageDetailHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Link
        href={backHref}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label="Retour"
      >
        <ArrowLeft className="size-4" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className={pageTitleClass}>{title}</h1>
          {badges}
        </div>
        {meta ? (
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            {meta}
          </div>
        ) : null}
      </div>
    </div>
  );
}
