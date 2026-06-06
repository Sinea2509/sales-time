import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type SalesTimeLogoMarkProps = {
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses = {
  sm: "size-6 rounded-md [&_svg]:size-3",
  md: "size-[30px] rounded-lg [&_svg]:size-[15px]",
} as const;

export function SalesTimeLogoMark({ size = "md", className }: SalesTimeLogoMarkProps) {
  return (
    <span
      className={cn(
        "bg-brand flex shrink-0 items-center justify-center text-white",
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      <TrendingUp strokeWidth={2.3} />
    </span>
  );
}
