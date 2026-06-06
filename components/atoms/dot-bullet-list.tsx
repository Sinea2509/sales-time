import { cn } from "@/lib/utils";

type DotBulletListProps = {
  items: string[];
  emptyMessage?: string;
  density?: "compact" | "comfortable";
  className?: string;
};

export function DotBulletList({
  items,
  emptyMessage,
  density = "comfortable",
  className,
}: DotBulletListProps) {
  if (items.length === 0) {
    if (!emptyMessage) return null;
    return (
      <p className="text-muted-foreground text-sm leading-relaxed">{emptyMessage}</p>
    );
  }

  return (
    <ul
      className={cn(
        "text-sm leading-relaxed text-neutral-700 dark:text-neutral-300",
        density === "compact" ? "space-y-2.5" : "space-y-3",
        className,
      )}
    >
      {items.map((line) => (
        <li key={line} className="flex items-start gap-2.5">
          <span
            className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-500"
            aria-hidden
          />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}
