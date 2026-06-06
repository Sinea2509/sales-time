import { cn } from "@/lib/utils";

type LandingGridOverlayProps = {
  className?: string;
};

export function LandingGridOverlay({ className }: LandingGridOverlayProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(108,77,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(108,77,255,0.04)_1px,transparent_1px)] bg-size-[48px_48px]",
        className,
      )}
      aria-hidden
    />
  );
}
