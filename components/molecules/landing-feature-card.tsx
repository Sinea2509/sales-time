import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type LandingFeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
};

export function LandingFeatureCard({
  title,
  description,
  icon: Icon,
  className,
}: LandingFeatureCardProps) {
  return (
    <div
      className={cn(
        "group cursor-default rounded-2xl border border-zinc-200 bg-white p-9 shadow-sm transition-colors hover:bg-zinc-50 sm:p-10",
        className,
      )}
    >
      <div className="mb-5 flex size-[42px] items-center justify-center rounded-[11px] border border-brand/20 bg-brand/10 transition-colors group-hover:border-brand group-hover:bg-brand">
        <Icon className="size-5 text-brand transition-colors group-hover:text-white" strokeWidth={1.7} />
      </div>
      <h3 className="mb-2.5 text-[17px] font-semibold tracking-tight text-zinc-950">{title}</h3>
      <p className="text-sm leading-[1.7] text-zinc-500">{description}</p>
    </div>
  );
}
