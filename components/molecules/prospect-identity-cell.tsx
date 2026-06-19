import Link from "next/link";
import { prospectInitials } from "@/lib/prospect-initials";

type ProspectIdentityCellProps = {
  displayName: string;
  company?: string | null;
  href?: string;
};

export function ProspectIdentityCell({
  displayName,
  company,
  href,
}: ProspectIdentityCellProps) {
  const nameClassName =
    "truncate font-semibold text-zinc-950 dark:text-zinc-50";

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        {prospectInitials(displayName)}
      </div>
      <div className="min-w-0">
        {href ? (
          <Link
            href={href}
            className={`text-brand hover:underline ${nameClassName}`}
          >
            {displayName}
          </Link>
        ) : (
          <p className={nameClassName}>{displayName}</p>
        )}
        {company?.trim() ? (
          <p className="text-muted-foreground truncate text-xs dark:text-zinc-500">
            {company.trim()}
          </p>
        ) : null}
      </div>
    </div>
  );
}
