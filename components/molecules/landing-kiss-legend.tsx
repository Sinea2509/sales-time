import { cn } from "@/lib/utils";

const kissLegendItems = [
  { key: "KEEP", label: "À conserver", color: "#16A34A" },
  { key: "IMPROVE", label: "À améliorer", color: "#0284C7" },
  { key: "START", label: "À démarrer", color: "#6C4DFF" },
  { key: "STOP", label: "À arrêter", color: "#DC2626" },
] as const;

type LandingKissLegendProps = {
  className?: string;
};

export function LandingKissLegend({ className }: LandingKissLegendProps) {
  return (
    <p
      className={cn(
        "text-[9.5px] leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {kissLegendItems.map((item, index) => (
        <span key={item.key}>
          {index > 0 ? " · " : null}
          <span className="font-bold" style={{ color: item.color }}>
            {item.key}
          </span>{" "}
          {item.label}
        </span>
      ))}
      {" · "}
      <span className="font-semibold text-muted-foreground">%</span> = niveau de
      maîtrise sur la thématique
    </p>
  );
}
