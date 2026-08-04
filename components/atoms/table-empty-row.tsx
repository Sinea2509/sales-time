import { cn } from "@/lib/utils";

type TableEmptyRowProps = {
  colSpan: number;
  message: string;
  /**
   * Ce que la personne peut faire ensuite, ou pourquoi le tableau est vide.
   *
   * « Aucun rendez-vous » décrit l'écran ; cette seconde ligne décrit la
   * situation. Un tableau vide sur un compte neuf et un tableau vide après un
   * filtre trop serré se ressemblent trait pour trait, et n'appellent pas le
   * même geste : c'est ici que la différence se dit.
   */
  description?: string;
  /** Larger vertical padding for wide admin tables. */
  size?: "default" | "large" | "hero";
  icon?: React.ComponentType<{ className?: string }>;
};

const sizeClasses = {
  default: "py-8",
  large: "py-12",
  hero: "py-16",
} as const;

export function TableEmptyRow({
  colSpan,
  message,
  description,
  size = "default",
  icon: Icon,
}: TableEmptyRowProps) {
  const corps = (
    <>
      <p>{message}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-xs text-balance text-muted-foreground dark:text-zinc-400">
          {description}
        </p>
      ) : null}
    </>
  );

  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn(
          "px-4 text-center text-sm text-muted-foreground dark:text-zinc-400",
          sizeClasses[size],
        )}
      >
        {Icon ? (
          <div className="flex flex-col items-center gap-2">
            <Icon
              aria-hidden
              className="size-8 text-muted-foreground/50 dark:text-zinc-600"
            />
            <div>{corps}</div>
          </div>
        ) : (
          corps
        )}
      </td>
    </tr>
  );
}
