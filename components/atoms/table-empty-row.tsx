import { cn } from "@/lib/utils";

type TableEmptyRowProps = {
  colSpan: number;
  message: string;
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
  size = "default",
  icon: Icon,
}: TableEmptyRowProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn(
          "px-4 text-center text-sm text-zinc-500 dark:text-zinc-400",
          sizeClasses[size],
        )}
      >
        {Icon ? (
          <div className="flex flex-col items-center gap-2">
            <Icon className="size-8 text-zinc-300 dark:text-zinc-600" />
            <p>{message}</p>
          </div>
        ) : (
          message
        )}
      </td>
    </tr>
  );
}
