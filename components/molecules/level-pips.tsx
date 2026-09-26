import { cn } from "@/lib/utils";

/**
 * Le niveau d'un critère, de 0 à 4, en quatre traits. Le chiffre est écrit
 * à côté par l'appelant ; les traits ne font que le rendre lisible de loin.
 */
export function LevelPips({
  level,
  max = 4,
  className,
}: {
  level: number;
  max?: number;
  className?: string;
}) {
  const fill =
    level <= 0 ? "bg-red-600" : level === 1 ? "bg-amber-600" : "bg-brand";
  return (
    <span
      className={cn(
        "inline-grid grid-flow-col gap-[3px] align-middle",
        className,
      )}
      role="img"
      aria-label={`Niveau ${level} sur ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <i
          key={i}
          className={cn(
            "block h-[7px] w-[15px] rounded-[2.5px] bg-border",
            i < level && fill,
          )}
        />
      ))}
    </span>
  );
}
