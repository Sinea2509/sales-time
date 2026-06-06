import { LandingTrustDot } from "@/components/atoms/landing-trust-dot";
import { cn } from "@/lib/utils";

type LandingTrustLineProps = {
  items: readonly string[];
  className?: string;
};

export function LandingTrustLine({ items, className }: LandingTrustLineProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-5 text-[12.5px] text-white/28",
        className,
      )}
    >
      {items.map((item, index) => (
        <span key={item} className="contents">
          {index > 0 ? <LandingTrustDot /> : null}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}
