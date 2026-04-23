import type { ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Shared `<th>` styling for dashboard / rendez-vous tables. */
export function DataTableHead({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "text-muted-foreground px-3 py-2.5 text-left text-[11px] font-semibold tracking-wider uppercase",
        className,
      )}
      {...props}
    />
  );
}
