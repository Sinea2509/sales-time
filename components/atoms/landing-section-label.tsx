import { cn } from "@/lib/utils";

type LandingSectionLabelProps = {
  children: React.ReactNode;
  variant?: "light" | "dark";
  className?: string;
};

export function LandingSectionLabel({
  children,
  variant = "light",
  className,
}: LandingSectionLabelProps) {
  return (
    <p
      className={cn(
        "text-[11.5px] font-semibold tracking-[0.08em] uppercase",
        variant === "light" ? "text-brand" : "text-brand-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}
