import { cn } from "@/lib/utils";

type LandingLogoMarkProps = {
  initials: string;
  color: string;
  className?: string;
};

export function LandingLogoMark({ initials, color, className }: LandingLogoMarkProps) {
  return (
    <span
      className={cn(
        "flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-[10px] font-extrabold text-white",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}
