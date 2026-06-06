import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type LandingCheckBulletProps = {
  children: React.ReactNode;
  className?: string;
};

export function LandingCheckBullet({ children, className }: LandingCheckBulletProps) {
  return (
    <div className={cn("flex items-center gap-2.5 text-sm text-zinc-600", className)}>
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-full border border-green-600/22 bg-green-600/10"
        aria-hidden
      >
        <Check className="size-2.5 text-green-600" strokeWidth={3} />
      </span>
      <span>{children}</span>
    </div>
  );
}
