import { cn } from "@/lib/utils";

type DotBulletListProps = {
  items: string[];
  emptyMessage?: string;
  density?: "compact" | "comfortable";
  className?: string;
  /**
   * Un fond teinté par élément, à la place de la puce : la couleur dit la
   * famille du conseil (retour de Thomas du 28 octobre 2026, « des fonds
   * colorés sur les textes, plus punchy »).
   */
  itemClassName?: string;
};

export function DotBulletList({
  items,
  emptyMessage,
  density = "comfortable",
  className,
  itemClassName,
}: DotBulletListProps) {
  if (items.length === 0) {
    if (!emptyMessage) return null;
    return (
      <p className="text-muted-foreground text-sm leading-relaxed">
        {emptyMessage}
      </p>
    );
  }

  if (itemClassName) {
    return (
      <ul className={cn("space-y-2", className)}>
        {items.map((line) => (
          <li
            key={line}
            className={cn(
              "rounded-lg px-3 py-2 text-sm leading-relaxed break-words text-foreground dark:text-neutral-200",
              itemClassName,
            )}
          >
            {line}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className={cn(
        "text-sm leading-relaxed text-foreground dark:text-neutral-300",
        density === "compact" ? "space-y-2.5" : "space-y-3",
        className,
      )}
    >
      {items.map((line) => (
        <li key={line} className="flex items-start gap-2.5">
          <span
            className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-muted-foreground/60 dark:bg-neutral-500"
            aria-hidden
          />
          <span className="min-w-0 break-words">{line}</span>
        </li>
      ))}
    </ul>
  );
}
