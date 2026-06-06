import { cn } from "@/lib/utils";

type PageIconTileProps = {
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  iconClassName?: string;
};

export function PageIconTile({
  icon: Icon,
  className,
  iconClassName,
}: PageIconTileProps) {
  return (
    <div
      className={cn(
        "bg-primary/8 ring-border/60 flex size-12 shrink-0 items-center justify-center rounded-xl ring-1",
        className,
      )}
    >
      <Icon className={cn("text-primary size-6", iconClassName)} aria-hidden />
    </div>
  );
}
