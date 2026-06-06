import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type LandingHowStepProps = {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
  showArrow?: boolean;
};

export function LandingHowStep({
  step,
  title,
  description,
  icon: Icon,
  className,
  showArrow = false,
}: LandingHowStepProps) {
  return (
    <div
      className={cn(
        "relative border border-white/7 bg-white/[0.025] px-8 py-9 first:rounded-l-[14px] last:rounded-r-[14px]",
        className,
      )}
    >
      {showArrow ? (
        <span
          className="absolute top-10 -right-3.5 z-2 hidden bg-[#06060A] px-0.5 text-base text-brand/50 lg:block"
          aria-hidden
        >
          →
        </span>
      ) : null}
      <p className="mb-4.5 text-[10.5px] font-bold tracking-[0.08em] text-brand uppercase">
        ÉTAPE {step}
      </p>
      <div className="mb-4.5 flex size-[42px] items-center justify-center rounded-[11px] border border-brand/22 bg-brand/12">
        <Icon className="size-5 text-brand-muted" strokeWidth={1.7} />
      </div>
      <h3 className="mb-2.5 text-[17px] font-semibold tracking-tight text-white/88">{title}</h3>
      <p className="text-[13.5px] leading-[1.7] text-white/36">{description}</p>
    </div>
  );
}
