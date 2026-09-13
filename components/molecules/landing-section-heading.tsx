import { LandingSectionLabel } from "@/components/atoms/landing-section-label";
import { cn } from "@/lib/utils";

type LandingSectionHeadingProps = {
  label?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  labelVariant?: "light" | "dark";
  className?: string;
};

export function LandingSectionHeading({
  label,
  title,
  description,
  align = "left",
  labelVariant = "light",
  className,
}: LandingSectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={cn(centered && "text-center", className)}>
      {label ? (
        <LandingSectionLabel variant={labelVariant} className="mb-3.5">
          {label}
        </LandingSectionLabel>
      ) : null}
      <h2
        className={cn(
          "text-[clamp(28px,3.2vw,46px)] leading-[1.13] font-bold tracking-tight text-foreground [&_em]:font-normal [&_em]:text-brand [&_em]:not-italic",
          centered && "dark:text-white",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 max-w-[520px] text-[17px] leading-[1.7] text-muted-foreground",
            centered && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
